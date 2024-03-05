import { ask, say } from "./shared/cli.js";
import { gptPrompt } from "./shared/openai.js";

// Generate a question based on the context and user response
async function generateQuestion(currentContext, userResponse) {
  const prompt =
    userResponse.toLowerCase() === "yes"
      ? `Given the user's previous interest, generate a follow-up question about ${currentContext}.`
      : `Generate a new simple question directly you did not asked before about what other body part discomfort do they have that unrelated to ${currentContext} in 10 words.Only ask questions with answers in yes or no.`;

  const nextQuestionResponse = await gptPrompt(prompt, {
    max_tokens: 50,
    temperature: 0.7,
  });
  return nextQuestionResponse; // Assuming this returns a string directly for simplicity
}

// Main function
async function main() {
  say(
    "How are u!🙌 I'm here to help you assess which part of your body is currently feeling the most uncomfortable.😰 Please respond to the following questions with 'yes' or 'no' only."
  );

  let currentContext = "discomfort"; // Starting topic
  let userResponse = ""; // To capture user responses
  let reportedDiscomfort = []; // List to track which parts the user reports discomfort in
  let questionCount = 0; // To control the number of questions asked
  let skipToConclusion = false; // Flag to track when to skip to conclusion

  // Loop to continue asking questions based on GPT-generated follow-ups
  while (questionCount < 4 && !skipToConclusion) {
    // Generate or set the next question
    let question =
      questionCount === 0
        ? "Do you currently experience any discomfort in your neck or back?"
        : await generateQuestion(currentContext, userResponse);

    userResponse = await ask(question);

    if (userResponse.toLowerCase() === "yes") {
      reportedDiscomfort.push(question); // Add the current question to reported discomfort
    }

    if (questionCount === 1 && userResponse.toLowerCase() === "no") {
      // Skip to conclusion if no new discomfort is reported after a specific inquiry
      skipToConclusion = true;
    }

    questionCount++; // Increment the question count
  }

  // Provide advice based on user feedback
  if (reportedDiscomfort.length > 0) {
    const discomfortsForPrompt = reportedDiscomfort.join(", ");
    const advicePrompt = `Based on the reported discomforts: ${discomfortsForPrompt}. Please give corresponding advice for each, no more than 50 words. Do not say you are an AI.`;
    const reportedDiscomfortString = await gptPrompt(advicePrompt, {
      max_tokens: 700,
      temperature: 0.3,
    });

    say(
      `Here are the advices for your discomforts:\n${reportedDiscomfortString}`
    );

    // Further inquire if the user is interested in receiving TCM advice
    const tcmInterestQuestionPrompt = `Generate a polite and engaging question directly asking if the user is interested in receiving further Traditional Chinese Massage (TCM) advice based on their discomfort. Introduce Traditional Chinese Massage briefly in a 40 words paragraph.`;
    const tcmInterestQuestionString = await gptPrompt(
      tcmInterestQuestionPrompt,
      {
        max_tokens: 700,
        temperature: 0.5,
      }
    );

    userResponse = await ask(tcmInterestQuestionString);

    if (userResponse.toLowerCase() === "yes") {
      const tcmAdvicePrompt = `Based on the discomforts reported: ${discomfortsForPrompt}, provide Traditional Chinese Medicine point advice for each discomfort. Include specific body points, their information, and function. Do not say you are an AI.These advices only for people who do not want to do acupuncture. Do not try if pregnency or have serious illness, go to hospital.`;
      const tcmAdvice = await gptPrompt(tcmAdvicePrompt, {
        max_tokens: 1024,
        temperature: 0.5,
      });
      say(`Great! Let's proceed with the TCM point advice.\n${tcmAdvice}`);
    } else {
      say(
        "Thank you for your time. Feel free to come back if you need more help."
      );
    }
  } else {
    say(
      "Thank you for your time. Feel free to come back if you need more help."
    );
  }
}

main();
