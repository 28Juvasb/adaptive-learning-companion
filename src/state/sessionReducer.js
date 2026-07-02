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

export function sessionReducer(state, action) {
  switch (action.type) {
    case "SET_SETUP":
      return {
        ...initialState,
        topic: action.topic.trim(),
        level: action.level.trim(),
        resources: action.resources.trim(),
        stage: "diagnose",
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
