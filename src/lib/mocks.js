// Canned, topic-aware responses used when no API key is configured (demo mode)
// or as a mental model of the exact JSON shapes each stage expects.

export function getMockResponse(key, ctx = {}) {
  const topic = ctx.topic || "the topic";

  switch (key) {
    case "scope":
      return {
        is_broad: true,
        subtopics: [
          { title: `Foundations of ${topic}`, blurb: `The core vocabulary and first principles behind ${topic}.` },
          { title: `The central mechanism of ${topic}`, blurb: `How the main cause-and-effect relationship actually works.` },
          { title: `Worked examples in ${topic}`, blurb: `Applying the ideas to concrete, step-by-step cases.` },
          { title: `Common pitfalls in ${topic}`, blurb: `Where learners usually go wrong, and how to avoid it.` },
          { title: `Advanced ${topic}`, blurb: `Extensions and edge cases once the basics are solid.` },
        ],
      };

    case "diagnose":
      return {
        questions: [
          {
            id: "q1",
            text: `In your own words, what is the most basic idea someone must understand before studying ${topic}?`,
            tests_prerequisite: "foundational vocabulary",
            difficulty: "easy",
          },
          {
            id: "q2",
            text: `Name one real-world example or situation where ${topic} shows up.`,
            tests_prerequisite: "contextual awareness",
            difficulty: "easy",
          },
          {
            id: "q3",
            text: `Explain a concept that ${topic} directly builds on, and how the two connect.`,
            tests_prerequisite: "prerequisite concept linkage",
            difficulty: "medium",
          },
          {
            id: "q4",
            text: `What would go wrong if someone tried to apply ${topic} without understanding its foundations?`,
            tests_prerequisite: "conceptual dependency reasoning",
            difficulty: "hard",
          },
        ],
      };

    case "remediate": {
      const questions = ctx.questions || [];
      const answers = ctx.answers || {};
      const grading = questions.map((q, i) => {
        const answered = (answers[q.id] || "").trim().length > 10;
        return {
          id: q.id,
          correct: answered && i < 2,
          feedback: answered
            ? i < 2
              ? "Good — you clearly have this foundation."
              : "Partially there, but the core mechanism is missing."
            : "No answer given, so this prerequisite is treated as a gap.",
        };
      });
      return {
        grading,
        gaps: [
          {
            concept: `core mechanism behind ${topic}`,
            severity: "major",
            correction: `The key point you missed: ${topic} depends on one central cause-and-effect relationship, not memorized facts.`,
            mini_lesson: `Think of ${topic} as a chain: input, transformation, output. The prerequisite you struggled with is the transformation step. Once you can describe what changes and why, everything downstream becomes predictable. Practice by explaining the transformation to yourself in one sentence.`,
          },
        ],
        solid_prerequisites: ["foundational vocabulary", "contextual awareness"],
        ready_for_main: false,
      };
    }

    case "teach":
      return {
        lesson_sections: [
          {
            heading: `What ${topic} is`,
            content: `${topic} is best understood as a system with inputs, a transformation, and outputs. In this lesson we build it up from the prerequisites you just confirmed, one layer at a time, so nothing rests on a gap.`,
          },
          {
            heading: "The core mechanism",
            content: `The heart of ${topic} is a single cause-and-effect relationship. When the input condition changes, the system responds in a predictable direction. Everything else in the topic is a variation or consequence of this mechanism.`,
          },
          {
            heading: "A worked example",
            content: `Take the simplest real case of ${topic}. Walk through it step by step: identify the input, watch the transformation happen, and name the output. Notice how the mini-lesson concept from your remediation appears here as the middle step.`,
          },
          {
            heading: "Where students go wrong",
            content: `The most common mistake is memorizing outcomes without the mechanism. If you can explain WHY the output follows the input, you can handle unfamiliar questions instead of only recognizing familiar ones.`,
          },
        ],
        check_questions: [
          { id: "c1", text: `Describe the core mechanism of ${topic} in one sentence.`, concept_tag: "core mechanism" },
          { id: "c2", text: `Walk through the worked example: what is the input, transformation, and output?`, concept_tag: "worked example" },
          { id: "c3", text: `Why does memorizing outcomes fail for ${topic}?`, concept_tag: "mechanism vs memorization" },
        ],
      };

    case "checkGrade": {
      const qs = ctx.checkQuestions || [];
      const ans = ctx.checkAnswers || {};
      return {
        results: qs.map((q, i) => {
          const answered = (ans[q.id] || "").trim().length > 10;
          return {
            id: q.id,
            correct: answered && i !== 1,
            correction: answered && i !== 1 ? "" : "Revisit the worked example: name the input, the transformation, and the output explicitly.",
            concept_tag: q.concept_tag,
          };
        }),
      };
    }

    case "reinforce": {
      const count = ctx.count || 15;
      const base = [
        {
          front: `What is the core mechanism of ${topic}?`,
          back: "A cause-and-effect relationship: a change in the input condition produces a predictable change in the output.",
          concept_tag: "core mechanism",
          difficulty: "medium",
        },
        {
          front: `In the ${topic} worked example, what are the three steps?`,
          back: "Input, transformation, output — in that order.",
          concept_tag: "worked example",
          difficulty: "easy",
        },
        {
          front: `Why is memorizing outcomes a weak strategy for ${topic}?`,
          back: "Because unfamiliar questions require reasoning from the mechanism; memorized outcomes only cover familiar cases.",
          concept_tag: "mechanism vs memorization",
          difficulty: "medium",
        },
        {
          front: `Which prerequisite must be solid before studying ${topic}?`,
          back: "The transformation step — being able to describe what changes and why.",
          concept_tag: "prerequisites",
          difficulty: "hard",
        },
      ];
      // In demo mode, synthesize enough cards to match the requested count so the
      // "choose card count" control behaves realistically without a network call.
      const sections = ctx.lessonSections || [];
      const cards = [...base];
      let i = 0;
      while (cards.length < count) {
        const section = sections[i % Math.max(sections.length, 1)];
        const heading = section?.heading || `key idea #${i + 1}`;
        cards.push({
          front: `Explain "${heading}" in the context of ${topic}.`,
          back: `A key point about ${topic}: ${heading} matters because it connects the mechanism to a concrete case.`,
          concept_tag: heading,
          difficulty: ["easy", "medium", "hard"][i % 3],
        });
        i++;
      }
      return { cards: cards.slice(0, count) };
    }

    default:
      throw new Error(`No mock response for key: ${key}`);
  }
}
