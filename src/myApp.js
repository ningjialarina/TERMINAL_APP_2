import { ask, say } from "./shared/cli.js";
import { gptPrompt } from "./shared/openai.js";

async function main() {
  say(
    "Hello! I'm Ning. I'm here to help you assess which part of your body is currently feeling the most uncomfortable. Please respond to the following questions with 'yes' or 'no' only."
  );

  const topic = "body discomfort"; // The topic for body testing questions

  // Dynamically generate body testing questions with GPT
  const questionsString = await gptPrompt(
    `Generate 4 body testing questions about neck and back without providing the answers. 
    The 4 questions should make steady progress incrementally based on the previous one. 
    The topic is ${topic}, do not give other methods about the discomfort. 
    Only ask questions with answers in yes or no. 
    Format the questions as a JavaScript array of strings like this: ["question 1", "question 2", "question 3", "question 4"] Only include the array, starting with [ and ending with ].`,
    { max_tokens: 600, temperature: 0.3 }
  );

  let questions = [];
  try {
    questions = JSON.parse(questionsString);
  } catch (_e) {
    say(`Error parsing questions string: "${questionsString}"`);
    return;
  }

  let reportedDiscomfort = []; // List to track which parts the user reports discomfort in

  for (let i = 0; i < questions.length; i++) {
    const response = await ask(questions[i]);
    if (response.toLowerCase() === "yes") {
      reportedDiscomfort.push(questions[i]); // Track which body parts the user reports discomfort in
    } else if (response.toLowerCase() === "no") {
      // No action needed for 'no' response
    } else {
      say("Please answer with 'yes' or 'no' only.");
      i--; // Ask the same question again
    }
  }

  if (reportedDiscomfort.length > 0) {
    const discomfortsForPrompt = reportedDiscomfort.join(", ");
    const advicePrompt = `Based on the reported discomforts: ${discomfortsForPrompt}. Please give corresponding advice for each, no more than 50 words. 
    Do not say you are an AI.`;
    const reportedDiscomfortString = await gptPrompt(advicePrompt, {
      max_tokens: 700,
      temperature: 0.3,
    });
    say(
      `Here are the advices for your discomforts:\n${reportedDiscomfortString}`
    );

    // Generate the question about further TCM advice using GPT
    const tcmInterestQuestionPrompt = `Generate a polite and engaging question directly asking if the user is interested in receiving further 
    Traditional Chinese Massage (TCM) advice based on their discomfort and intruduce Traditional Chinses Massage briefly in 40 words paragraph.`;
    const tcmInterestQuestionString = await gptPrompt(
      tcmInterestQuestionPrompt,
      {
        max_tokens: 64,
        temperature: 0.5,
      }
    );

    // Ask the dynamically generated question to the user
    const interestResponse = await ask(tcmInterestQuestionString);
    if (interestResponse.toLowerCase() === "yes") {
      const tcmAdvicePrompt = `Based on the discomforts reported: ${discomfortsForPrompt}, provide Traditional Chinese Massage point advice for each discomfort. 
      Include specific body points, their information, and function. Do not say you are an AI.`;
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
      "Based on your responses, you do not seem to have reported significant discomfort in response to any of the questions."
    );
  }
}

main();
