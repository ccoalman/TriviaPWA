let apiURL = 'https://opentdb.com/api.php?amount=10';

document.getElementById("fetch-button").addEventListener("click", fetchTrivia);

async function fetchTrivia() {
  try {
    // Fetch trivia questions
    const response = await fetch(apiURL);
    const data = await response.json();
    const questions = data.results;

    // Display all questions
    displayAllQuestions(questions);

  } catch (error) {
    console.error("Error fetching trivia:", error);
  }
}

function displayAllQuestions(questions) {
  const questionsList = document.getElementById("questions-list");
  questionsList.innerHTML = ""; // Clear previous content

  questions.forEach((question, index) => {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question-card";
    questionDiv.innerHTML = `
      <h3>${index + 1}. ${question.question}</h3>
    `;
    questionsList.appendChild(questionDiv);
  });
}
