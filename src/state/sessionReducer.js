// The 5-stage pedagogical state machine.
// setup -> diagnose -> remediate -> teach -> reinforce -> review

export const STAGES = ["setup", "diagnose", "remediate", "teach", "reinforce", "review"];

export const STAGE_LABELS = {
  setup: "Setup",
  diagnose: "Diagnose",
  remediate: "Remediate",
  teach: "Teach",
  reinforce: "Reinforce",
  review: "Review",
};

export const initialState = {
  stage: "setup",
  // intake
  topic: "",
  level: "",
  resources: "",
  // uploaded documents used for grounding (available across the first five stages)
  attachments: [], // [{ name, chars, text }]
  // follow-up chat with the tutor
  chat: [], // [{ role: 'user'|'assistant', content }]
  // diagnose
  questions: [], // [{ id, text, tests_prerequisite, difficulty }]
  answers: {}, // { [questionId]: string }
  // remediate
  grading: [], // [{ id, correct, feedback }]
  gaps: [], // [{ concept, severity, correction, mini_lesson }]
  solidPrereqs: [], // prerequisite concepts the student already has
  readyForMain: null,
  // teach
  lesson: null, // { lesson_sections: [{heading, content}], check_questions: [{id, text, concept_tag}] }
  checkAnswers: {}, // { [checkQuestionId]: string }
  checkResults: null, // [{ id, correct, correction, concept_tag }]
  // reinforce
  sessionCards: [], // cards generated this session (also merged into the persistent deck)
};

// Combine pasted resources + uploaded document text into one grounding blob.
export function groundingText(state) {
  const parts = [];
  if (state.resources) parts.push(state.resources);
  for (const a of state.attachments) {
    parts.push(`--- From uploaded file: ${a.name} ---\n${a.text}`);
  }
  return parts.join("\n\n");
}

export function sessionReducer(state, action) {
  switch (action.type) {
    case "SET_SETUP":
      return {
        ...initialState,
        topic: action.topic.trim(),
        level: action.level.trim(),
        resources: action.resources.trim(),
        // preserve any files attached during setup
        attachments: state.attachments,
        stage: "diagnose",
      };

    case "ADD_ATTACHMENT":
      // dedupe by name
      if (state.attachments.some((a) => a.name === action.attachment.name)) return state;
      return { ...state, attachments: [...state.attachments, action.attachment] };

    case "REMOVE_ATTACHMENT":
      return { ...state, attachments: state.attachments.filter((a) => a.name !== action.name) };

    case "ADD_CHAT_MESSAGE":
      return { ...state, chat: [...state.chat, action.message] };

    case "UPDATE_LAST_CHAT":
      // replace the content of the last (assistant) message — used while streaming
      return {
        ...state,
        chat: state.chat.map((m, i) =>
          i === state.chat.length - 1 ? { ...m, content: action.content } : m
        ),
      };

    case "RECEIVE_QUESTIONS":
      return { ...state, questions: action.questions, answers: {} };

    case "SET_ANSWER":
      return { ...state, answers: { ...state.answers, [action.id]: action.value } };

    case "SUBMIT_ANSWERS":
      return { ...state, stage: "remediate" };

    case "RECEIVE_GAPS":
      return {
        ...state,
        grading: action.grading,
        gaps: action.gaps,
        solidPrereqs: action.solidPrereqs,
        readyForMain: action.readyForMain,
      };

    case "RECEIVE_LESSON":
      return { ...state, lesson: action.lesson, checkAnswers: {}, checkResults: null };

    case "SET_CHECK_ANSWER":
      return { ...state, checkAnswers: { ...state.checkAnswers, [action.id]: action.value } };

    case "RECEIVE_CHECK_RESULTS":
      return { ...state, checkResults: action.results };

    case "RECEIVE_CARDS":
      return { ...state, sessionCards: action.cards };

    case "GO_TO_STAGE":
      return { ...state, stage: action.stage };

    case "RESET_SESSION":
      return { ...initialState };

    default:
      return state;
  }
}
