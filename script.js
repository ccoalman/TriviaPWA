let PEXELS_API_KEY = "qOsTAa8WI9ALWQKHQbLB5lWHDGkxuaEhOyFnGRXf6MAeP5jEql5r1G3L";
let currentQuestionIndex = 0;
let questionsData = [];
let timerId;
let timeLeft = 15;
let answerSelected = false;
let score = 0;

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
        let amount = document.getElementById("Qnum").value;
        if (!amount) {
            alert("Please enter the number of questions.");
            return;
        }
        let category = document.getElementById("categories").value || ""; 
        let difficulty = document.getElementById("difficulty").value || ""; 

        const apiURL = `https://opentdb.com/api.php?amount=${amount}${category ? `&category=${category}` : ''}${difficulty ? `&difficulty=${difficulty}` : ''}`;
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
        question.imageUrl = imageUrls[index];
    });
}

async function fetchAndReturnImageUrl(query) {
    let imageData = await fetchPexelsData(query);
    return imageData?.photos?.[0]?.src?.medium;
}

function displayQuestion(index) {
    let timerElement = document.getElementById('timer');
    timerElement.style.display = 'block'; // Show the timer when displaying a question
    answerSelected = false; // Reset answer selection flag

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
            answerSelected = true; // Set the flag to true when an answer is selected
            clearInterval(timerId);
            showFeedback(answer, question.correct_answer, questionDiv);
            timerElement.style.display = 'none';
        };
        questionDiv.appendChild(answerButton);
    });
    questionsList.appendChild(questionDiv);
    startTimer(timeLeft, timerElement);
}

function startTimer(duration, display) {
    let timer = duration, seconds;
    timerId = setInterval(function () {
        seconds = parseInt(timer % 60, 10);
        display.textContent = seconds;
        if (--timer < 0) {
            clearInterval(timerId);
            if (!answerSelected) {
                displayTimeOutFeedback(questionsData[currentQuestionIndex], document.querySelector('.question-card'));
            } else {
                nextQuestion();
            }
        }
    }, 1000);
}


function nextQuestion() {
    if (currentQuestionIndex < questionsData.length - 1) {
        currentQuestionIndex++;
        displayQuestion(currentQuestionIndex);
    } else {
        showFinalScreen();
    }
}

function displayTimeOutFeedback(question, questionDiv) {
    const feedbackDiv = document.createElement("div");
    feedbackDiv.className = "feedback-card";
    feedbackDiv.innerHTML = `<h2>Time's up!</h2><p>The correct answer was: ${question.correct_answer}</p>`;
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

// function showFeedback(selectedAnswer, correctAnswer, questionDiv) {
//     const feedbackDiv = document.createElement("div");
//     feedbackDiv.className = "feedback-card";
//     if (selectedAnswer === correctAnswer) {
//         feedbackDiv.innerHTML = `<h2>Correct!</h2>`;
//     } else {
//         feedbackDiv.innerHTML = `<h2>Wrong!</h2><p>The correct answer was: ${correctAnswer}</p>`;
//     }
//     questionDiv.innerHTML = "";
//     questionDiv.appendChild(feedbackDiv);
//     const proceedButton = document.createElement("button");
//     proceedButton.innerHTML = "Next Question";
//     proceedButton.onclick = () => {
//         if (currentQuestionIndex < questionsData.length - 1) {
//             currentQuestionIndex++;
//             displayQuestion(currentQuestionIndex);
//         } else {
//             showFinalScreen();
//         }
//     };
//     questionDiv.appendChild(proceedButton);
// }

function showFeedback(selectedAnswer, correctAnswer, questionDiv) {
    const feedbackDiv = document.createElement("div");
    feedbackDiv.className = "feedback-card";

    let points = 0;
    if (selectedAnswer === correctAnswer) {
        let timeUsed = 15 - timeLeft; // Assuming 'timeLeft' is tracked elsewhere in your code
        if (timeUsed <= 5) {
            points = 1000;
        } else if (timeUsed <= 10) {
            points = 500;
        } else {
            points = 200;
        }
        score += points; // Assuming 'score' is a variable tracking the user's score
        feedbackDiv.innerHTML = `<h2 class="correct">Correct!</h2><p class="points">You earned ${points} points!</p>`;
    } else {
        feedbackDiv.innerHTML = `<h2 class="wrong">Wrong!</h2><p>The correct answer was: ${correctAnswer}</p>`;
    }

    questionDiv.innerHTML = "";
    questionDiv.appendChild(feedbackDiv);

    const proceedButton = document.createElement("button");
    proceedButton.innerHTML = "Next Question";
    proceedButton.onclick = function() {
        if (currentQuestionIndex < questionsData.length - 1) {
            displayQuestion(++currentQuestionIndex);
        } else {
            showFinalScreen();
        }
    };
    questionDiv.appendChild(proceedButton);
}


function shuffleAnswers(answers) {
    for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
    }
    return answers;
}

// function showFinalScreen() {
//     clearInterval(timerId);
//     document.getElementById('timer').style.display = 'none';
//     let questionsList = document.getElementById("questions-list");
//     questionsList.innerHTML = `<h2>Quiz Completed!</h2>`;
//     document.getElementById("trivia-form").style.display = 'block';
// }

// function showFinalScreen() {
//     clearInterval(timerId);
//     document.getElementById('timer').style.display = 'none';
//     let questionsList = document.getElementById("questions-list");
//     questionsList.innerHTML = `<h2>Quiz Completed!</h2><p>Your total score: ${score}</p>`;
//     document.getElementById("trivia-form").style.display = 'block';
// }

function showFinalScreen() {
    clearInterval(timerId); // Stop any running timer
    document.getElementById('timer').style.display = 'none'; // Hide the timer display

    // Access the quiz questions list container
    let questionsList = document.getElementById("questions-list");

    // Show the completion message and total score
    questionsList.innerHTML = `<h2>Quiz Completed!</h2><p>Your total score: ${score}</p>`;

    // Create a button to reset the game
    const resetButton = document.createElement("button");
    resetButton.innerHTML = "Start Again";
    resetButton.className = "reset-button"; // Optional: Assign a class for styling
    resetButton.onclick = function() {
        resetGame();
    };

    // Add the reset button to the screen
    questionsList.appendChild(resetButton);

}

function resetGame() {
    currentQuestionIndex = 0; // Reset the question index
    score = 0; // Reset the score
    questionsData = []; // Optionally clear the previous questions data
    document.getElementById("trivia-form").style.display = 'block'; // Show the form again
    document.getElementById("questions-list").innerHTML = ''; // Clear the questions list
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
    document.getElementById('timer').style.display = 'none'; 
    fetchCategories();
    handleFormSubmit();
};




// handle install prompt
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

// load the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js').then(function(registration) {
      console.log('Service Worker registered with scope:', registration.scope);
    }, function(error) {
      console.log('Service Worker registration failed:', error);
    });
  });
}                    
             

