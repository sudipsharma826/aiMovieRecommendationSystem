import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RecommendationsSchema } from "../schemas/movie.schema";
import { ChatOpenRouter } from "@langchain/openrouter";

// create and configure the LLM in one place
// if we want to change the provider/model later (GPT -> Claude -> Gemini),
// we only change this function instead of every file.
function getChatModel() {
  return new ChatOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,

    // which model OpenRouter should call
    // controlled by OPENROUTER_MODEL env (default to deepseek if missing)
    model: process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat-v3",
    maxTokens: 4000, // max tokens in the response

    // controls randomness
    // lower = more deterministic
    // higher = more creative
    temperature: 0.7,
  });
}

// create ONE reusable model instance
// the model object is our connection to the LLM
// we reuse it everywhere instead of creating a new ChatOpenRouter()
// every time we want to make a request.
const model = getChatModel();

const promptTemplate = ChatPromptTemplate.fromMessages([
  [
    "system",
    // system message = who the AI is + how it should behave
    // sent on every req before the users message
    // sets the personality and rules for the system
    `You are a movie recommendation expert.

Return high-quality recommendations based on:
- user's request
- genre
- mood
- count

Every movie should feel intentional.
Do not recommend only the most obvious titles every time.`,
  ],
  [
    "human",
    // human msg - user's req with variables
    // {variables} are replaced during invoke()
    `User request: {userPrompt}

Preferences:
- Genre: {genre}
- Mood: {mood}
- Number of movies: {count}`,
  ],
]);

export async function getRecommendations(input: {
  userPrompt: string;
  genre: string;
  mood: string;
  count: number;
}) {
  // connect PromptTemplate -> Model
  // output of the prompt becomes input to the LLM
  const chain = promptTemplate.pipe(model);

  // .pipe(model) = LCEL - langchain expression language
  // connects components into a chain
  // input -> prompt template -> fills variables -> model -> response

  const response = await chain.invoke({
    // invoke() runs the entire chain
    // 1. replace variables
    // 2. build chat messages
    // 3. send to the LLM
    // 4. return the AI response

    userPrompt: input.userPrompt,
    genre: input.genre,
    mood: input.mood,
    count: input.count,
  });

  console.log(response.text);

  // response is an AIMessage object
  // .text gives only the generated text
  return response.text;
}

// zod + structured output

// wrap the normal model so it returns data
// matching RecommendationsSchema instead of plain text
// LangChain automatically asks the LLM for structured JSON
// and validates it using the Zod schema.
const structuredModel = model.withStructuredOutput(RecommendationsSchema);

export async function getStructuredRecommendations(input: {
  userPrompt: string;
  genre: string;
  mood: string;
  count: number;
}) {
  // same prompt
  // different model
  // this model returns a validated JavaScript object
  const chain = promptTemplate.pipe(structuredModel);

  const result = await chain.invoke({
    userPrompt: input.userPrompt,
    genre: input.genre,
    mood: input.mood,
    count: input.count,
  });

  console.log(result);

  // already parsed and validated
  // no JSON.parse() needed
  return result;
}