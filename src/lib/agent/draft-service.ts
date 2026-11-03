import { ContactChannel, FollowUpTask, ToneModifier } from '../types';

export interface DraftResult {
  draftText: string;
  emailSubject?: string;
  isUrgentClinicalConcern: boolean;
  escalationNotice?: string;
  source: 'ai_gemini' | 'deterministic_template';
  warning?: string;
}

// Clinical urgency triggers: indicate scenarios requiring clinical nurse/physician escalation
const URGENT_SYMPTOM_TRIGGERS = [
  'chest pain',
  'shortness of breath',
  'difficulty breathing',
  'severe bleeding',
  'unconscious',
  'stroke',
  'sudden numbness',
  'fainting',
  'syncope',
  'acute pain',
  'severe swelling',
  'high fever with stiff neck',
  'immediate danger',
  'emergency',
  'call 911',
];

// Forbidden prescriptive or diagnostic terms
const FORBIDDEN_CLINICAL_ADVICE = [
  /\btake\s+\d+\s*(mg|mcg|ml|tablets?|pills?)\b/i,
  /\bstop\s+taking\b/i,
  /\bincrease\s+your\s+dosage\b/i,
  /\bdecrease\s+your\s+dosage\b/i,
  /\byou\s+have\s+been\s+diagnosed\s+with\b/i,
  /\byour\s+condition\s+is\s+(dangerous|fatal|critical)\b/i,
  /\byou\s+have\s+an\s+infection\b/i,
  /\bdiscontinue\s+medication\b/i,
];

/**
 * Screen patient context for potential acute symptoms requiring staff escalation
 */
export function screenForUrgentConcerns(task: FollowUpTask): {
  isUrgent: boolean;
  notice?: string;
} {
  const textToScan = `${task.primaryDiagnosis} ${task.clinicalDirective}`.toLowerCase();
  for (const trigger of URGENT_SYMPTOM_TRIGGERS) {
    if (textToScan.includes(trigger)) {
      return {
        isUrgent: true,
        notice: `POTENTIAL URGENT CLINICAL CONCERN DETECTED: This patient record references '${trigger}'. In accordance with clinic safety protocol, non-urgent automated outreach should not be sent. Please follow your clinic's established clinical escalation workflow to immediately notify the on-call triage nurse or attending physician.`,
      };
    }
  }
  return { isUrgent: false };
}

/**
 * Verify that generated text does not contain diagnostic, prescriptive, or clinical advice statements
 */
export function verifySafetyGuardrails(text: string): {
  passed: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  for (const pattern of FORBIDDEN_CLINICAL_ADVICE) {
    if (pattern.test(text)) {
      violations.push(`Contains forbidden clinical phrasing matching ${pattern.toString()}`);
    }
  }
  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Generate a safe, neutral, respectful follow-up draft
 */
export async function generateOutreachDraft(
  task: FollowUpTask,
  channel: ContactChannel,
  tone: ToneModifier = 'standard'
): Promise<DraftResult> {
  // 1. Safety Screening: Check for acute clinical concerns
  const screening = screenForUrgentConcerns(task);
  if (screening.isUrgent) {
    return {
      draftText: '',
      isUrgentClinicalConcern: true,
      escalationNotice: screening.notice,
      source: 'deterministic_template',
      warning: 'Outreach generation halted: clinical escalation required by clinic policy.',
    };
  }

  // 2. Attempt AI generation if GEMINI_API_KEY is present
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim().length > 0) {
    try {
      const aiResult = await generateWithGemini(task, channel, tone, apiKey);
      const guardrailCheck = verifySafetyGuardrails(aiResult.draftText);
      if (guardrailCheck.passed) {
        return aiResult;
      }
      console.warn('AI output flagged by safety guardrails, falling back to deterministic template:', guardrailCheck.violations);
    } catch (err) {
      console.warn('AI generation encountered error, falling back to deterministic template:', err);
    }
  }

  // 3. Deterministic safe templates (used if no AI key, network unavailable, or flagged by guardrail)
  return generateDeterministicTemplate(task, channel, tone);
}

/**
 * Call Gemini API using secure server-side native fetch
 */
async function generateWithGemini(
  task: FollowUpTask,
  channel: ContactChannel,
  tone: ToneModifier,
  apiKey: string
): Promise<DraftResult> {
  const patient = task.patient;
  const firstName = patient.fullName.split(' ')[0] || patient.fullName;
  const clinicPhone = '(555) 019-2830';
  const clinicName = 'Metro Health Clinic';

  const systemPrompt = `You are an administrative communication copilot for outpatient clinic staff at ${clinicName}.
Your duty is to draft a neutral, concise, and respectful follow-up communication to a patient.

STRICT CLINICAL AND ETHICAL SAFETY RULES:
1. NEVER diagnose, interpret lab results, or evaluate medical symptoms.
2. NEVER prescribe, alter, or recommend medication, dosages, or treatments.
3. NEVER make clinical claims or declare urgency.
4. Use ONLY the supplied patient details and physician directive.
5. If the physician's directive is vague or missing, produce a safe, generic scheduling inquiry (e.g. "regarding your recent appointment") rather than inventing details.
6. Tone: Respectful, polite, professional.
7. Return ONLY valid JSON with keys: "draft" (string), "subject" (string or null).`;

  const userPrompt = `Patient Details:
- Name: ${patient.fullName} (First name: ${firstName})
- Attending Doctor: ${task.attendingProvider}
- Primary Encounter Reason: ${task.primaryDiagnosis}
- Doctor's Directive: ${task.clinicalDirective || 'None specified'}
- Due Date: ${task.dueDate} (${task.daysOverdue > 0 ? `${task.daysOverdue} days overdue` : 'Due today'})
- Channel: ${channel.toUpperCase()}
- Tone modifier: ${tone}
- Clinic Phone: ${clinicPhone}

Instructions for Channel:
${
  channel === 'sms'
    ? '- Keep it under 260 characters. Friendly, administrative reminder to contact the clinic to schedule or confirm their follow-up.'
    : channel === 'phone'
    ? '- Produce structured staff talking points: 1) Staff introduction, 2) Verify patient identity, 3) Reason for call (on behalf of Dr.), 4) Appointment scheduling offer, 5) Voicemail script if no answer.'
    : '- Professional formal email draft with clear subject line, greeting, polite follow-up request, and clinic contact info.'
}

Produce JSON output only:`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API responded with status ${res.status}`);
  }

  const json = await res.json();
  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty response from Gemini');
  }

  const parsed = JSON.parse(rawText);
  return {
    draftText: parsed.draft,
    emailSubject: channel === 'email' ? parsed.subject || `Follow-Up Care Reminder — ${clinicName}` : undefined,
    isUrgentClinicalConcern: false,
    source: 'ai_gemini',
  };
}

/**
 * Deterministic safe templates based strictly on patient context and channel
 */
function generateDeterministicTemplate(
  task: FollowUpTask,
  channel: ContactChannel,
  tone: ToneModifier
): DraftResult {
  const patient = task.patient;
  const firstName = patient.fullName.split(' ')[0] || patient.fullName;
  const doctor = task.attendingProvider;
  const clinicPhone = '(555) 019-2830';
  const clinicName = 'Metro Health Clinic';

  // Check if directive is vague or missing
  const hasDirective = task.clinicalDirective && task.clinicalDirective.trim().length > 10;
  const directiveSnippet = hasDirective
    ? task.primaryDiagnosis
    : 'your recent outpatient appointment';

  let draftText = '';
  let emailSubject: string | undefined;

  switch (channel) {
    case 'sms': {
      if (tone === 'briefer') {
        draftText = `Hi ${firstName}, this is ${clinicName}. Please call us at ${clinicPhone} to schedule your follow-up with ${doctor}. Reply STOP to opt out.`;
      } else if (tone === 'gentle') {
        draftText = `Hello ${firstName}, warm greetings from ${clinicName}. Dr. ${doctor.split(',')[0]} asked us to check in and help schedule your follow-up visit. Please reach us at ${clinicPhone} when convenient.`;
      } else if (tone === 'direct') {
        draftText = `Hello ${firstName}, your follow-up appointment with ${doctor} at ${clinicName} is due. Please call ${clinicPhone} today to pick a time. Reply STOP to opt out.`;
      } else {
        // Standard
        draftText = `Hi ${firstName}, this is ${clinicName} checking in on behalf of ${doctor} regarding your follow-up for ${directiveSnippet}. Please call us at ${clinicPhone} or reply to schedule. Reply STOP to opt out.`;
      }
      break;
    }

    case 'email': {
      emailSubject = `Follow-Up Appointment Reminder — ${clinicName}`;
      if (tone === 'briefer') {
        draftText = `Dear ${patient.fullName},

This is a brief reminder from ${clinicName} regarding your follow-up appointment with ${doctor}.

Please contact our scheduling desk at ${clinicPhone} at your earliest convenience to book a date and time.

Best regards,
Outpatient Care Team
${clinicName}
Phone: ${clinicPhone}`;
      } else if (tone === 'gentle') {
        draftText = `Dear ${patient.fullName},

We hope this message finds you well. 

${doctor} asked our care coordination team to reach out regarding your follow-up care following your visit for ${directiveSnippet}. We want to ensure you have everything you need.

When you have a moment, please call us at ${clinicPhone} so we can help arrange a follow-up consultation that fits your schedule.

Warm regards,
Outpatient Care Coordination
${clinicName}
Phone: ${clinicPhone}`;
      } else {
        // Standard / Direct
        draftText = `Dear ${patient.fullName},

Our records indicate that you are due for a follow-up appointment with ${doctor} regarding ${directiveSnippet}.

To ensure continuity of care, please contact our scheduling office at ${clinicPhone} or reply to this message with your preferred days of the week.

Clinic Hours: Monday – Friday, 8:00 AM – 5:00 PM
Contact Number: ${clinicPhone}

Sincerely,
Care Coordination Team
${clinicName}`;
      }
      break;
    }

    case 'phone': {
      // Structured Phone-Call Script with Talking Points
      draftText = `[PHONE CALL SCRIPT — OUTBOUND STAFF GUIDE]

1. IDENTIFICATION & GREETING:
   "Hello, may I please speak with ${patient.fullName}? My name is [Staff Name] calling from ${clinicName}."

2. REASON FOR OUTREACH:
   "I am calling on behalf of ${doctor}. Our records show it is time to arrange your follow-up check regarding ${directiveSnippet}."

3. SCHEDULING OFFER:
   "Do you have a few moments right now to find a date and time that works well for you?"
   - Available options: Morning or Afternoon slots this week.

4. RECORDING OUTCOME:
   - If Patient Agrees: Confirm appointment date/time and update status to 'Appointment scheduled'.
   - If Patient Declines: Respectfully note their preference and record 'Declined'.
   - If Patient Requests Later Call: Note preferred callback time and record 'Follow-up needed'.

5. VOICEMAIL SCRIPT (IF UNANSWERED):
   "Hello, this is [Staff Name] from ${clinicName} calling for ${firstName}. ${doctor} asked us to reach out regarding your follow-up care. Please return our call at ${clinicPhone} at your convenience. Thank you."`;
      break;
    }
  }

  return {
    draftText,
    emailSubject,
    isUrgentClinicalConcern: false,
    source: 'deterministic_template',
  };
}
