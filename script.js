let PEXELS_API_KEY = "qOsTAa8WI9ALWQKHQbLB5lWHDGkxuaEhOyFnGRXf6MAeP5jEql5r1G3L";
let currentQuestionIndex = 0;
let questionsData = [];

async function fetchCategories() {
    let url = 'https://opentdb.com/api_category.php';
    try {
        let response = await fetch(url);
        let data = await response.json();
        let selectElement = document.getElementById('categories');
        data.trivia_categories.forEach(category => {
            let option = document.createElement('option');
            option.value = category.id;
            option.innerHTML = category.name;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

function handleFormSubmit() {
    let form = document.getElementById("trivia-form");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        let amount = document.getElementById("Qnum").value || 10;
        let category = document.getElementById("categories").value || "";
        let difficulty = document.getElementById("difficulty").value || "";
        const apiURL = `https://opentdb.com/api.php?amount=${amount}&category=${category}&difficulty=${difficulty}`;
        await fetchTrivia(apiURL);
        form.style.display = 'none'; 
    });
}

async function fetchTrivia(apiURL) {
    try {
        let response = await fetch(apiURL);
        let data = await response.json();
        if (!data.results || data.results.length === 0) {
            throw new Error("No trivia questions found.");
        }
        questionsData = data.results;
        await preloadImages(data.results); 
        displayQuestion(currentQuestionIndex);
    } catch (error) {
        console.error("Error fetching trivia:", error);
    }
}

async function preloadImages(questions) {
    const imageUrls = await Promise.all(questions.map(question =>
        fetchAndReturnImageUrl(extractKeywordsWithPriority(question.question))
    ));
    questions.forEach((question, index) => {
        question.imageUrl = imageUrls[index]; // Attach preloaded image URL to each question
    });
}

async function fetchAndReturnImageUrl(query) {
    let imageData = await fetchPexelsData(query);
    return imageData?.photos?.[0]?.src?.medium;
}

async function displayQuestion(index) {
    let questionsList = document.getElementById("questions-list");
    questionsList.innerHTML = ""; // Clear previous content
    let question = questionsData[index];
    let questionDiv = document.createElement("div");
    questionDiv.className = "question-card";
    let answers = shuffleAnswers([
        question.correct_answer,
        ...question.incorrect_answers,
    ]);
    questionDiv.innerHTML = `
        <h3>${index + 1}. ${question.question}</h3>
        <img src="${question.imageUrl}" alt="Image related to question" class="question-image">
    `;
    answers.forEach((answer) => {
        let answerButton = document.createElement("button");
        answerButton.innerHTML = answer;
        answerButton.className = "answer-button";
        answerButton.onclick = () => {
            showFeedback(answer, question.correct_answer, questionDiv);
        };
        questionDiv.appendChild(answerButton);
    });
    questionsList.appendChild(questionDiv);
}

function showFeedback(selectedAnswer, correctAnswer, questionDiv) {
    const feedbackDiv = document.createElement("div");
    feedbackDiv.className = "feedback-card";
    if (selectedAnswer === correctAnswer) {
        feedbackDiv.innerHTML = `<h2>Correct!</h2>`;
    } else {
        feedbackDiv.innerHTML = `<h2>Wrong!</h2><p>The correct answer was: ${correctAnswer}</p>`;
    }
    questionDiv.innerHTML = ""; // Clear the question content
    questionDiv.appendChild(feedbackDiv);
    const proceedButton = document.createElement("button");
    proceedButton.innerHTML = "Next Question";
    proceedButton.onclick = () => {
        if (currentQuestionIndex < questionsData.length - 1) {
            currentQuestionIndex++;
            displayQuestion(currentQuestionIndex);
        } else {
            showFinalScreen();
        }
    };
    questionDiv.appendChild(proceedButton);
}

function showFinalScreen() {
    let questionsList = document.getElementById("questions-list");
    questionsList.innerHTML = `<h2>Quiz Completed!</h2>`;
    document.getElementById("trivia-form").style.display = 'block'; // Re-display the form for a new game
}

function shuffleAnswers(answers) {
    for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
    }
    return answers;
}

async function fetchPexelsData(search) {
    let url = `https://api.pexels.com/v1/search?per_page=1&query=${search}`;
    let headers = { Authorization: PEXELS_API_KEY };
    try {
        let response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching Pexels data:", error);
        return null;
    }
}

function extractKeywordsWithPriority(questionText) {
    let stopWords = ["what", "is", "the", "of", "in", "on", "and", "a", "an"];
    let words = questionText.split(" ");
    let uppercaseWords = words.filter(word => /^[A-Z]/.test(word));
    if (uppercaseWords.length > 0) {
        return uppercaseWords.join(" ");
    }
    let filteredWords = words.map(word => word.toLowerCase().replace(/[^a-z]/g, "")).filter(word => !stopWords.includes(word) && word.length > 2);
    return filteredWords.slice(0, 3).join(" ") || "trivia";
}

// Initialize functions on page load
window.onload = function () {
    fetchCategories();
    handleFormSubmit();
};




// install app
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const installButton = document.getElementById('installButton');
  installButton.style.display = 'block';

  installButton.addEventListener('click', () => {
    installButton.style.display = 'none';
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      deferredPrompt = null;
    });
  });
});  