// const typingTest = document.querySelector(".typing-test p");
const typingTest = document.querySelector("p.typing-test2"),
  inputField = document.querySelector(".wrapper .input-field");

const mistakesTag = document.querySelector(".mistakes span");
const timerTag = document.querySelector(".timer span");
const wpmTag = document.querySelector(".wpm span");
const clicksTag = document.querySelector(".clicks span");
const tryAgainBtn = document.querySelector(".reload-btn");

var chrcIndex = mistakeCount = 0;

var maxTime = 60;
var timeLeft = maxTime;
var timer;
var ifTyping = false;

function randomPara() {
  var RandomIndex = Math.floor(Math.random() * sentences.length);
  typingTest.innerHTML = "";
  sentences[RandomIndex].split("").forEach((span) => {
    var spanTag = `<span>${span}</span>`;
    typingTest.innerHTML += spanTag;
  });
  typingTest.querySelectorAll("span")[0].classList.add("active");
  document.addEventListener("keydown", () => inputField.focus());
  typingTest.addEventListener("click", () => inputField.focus());
}

function initTyping() {
  const characters = typingTest.querySelectorAll("span");
  var typedChrc = inputField.value.split("")[chrcIndex];

  var wpm = Math.round(
    ((chrcIndex - mistakeCount) / 5 / (maxTime - timeLeft)) * 60
  );
  // if wpm is less than zero , empty or infinity then set it to zero.
  if (chrcIndex < characters.length - 1 && timeLeft > 0) {
    wpm = wpm < 0 || !wpm || wpm === Infinity ? 0 : wpm;
    if (!ifTyping) {
      timer = setInterval(initTimer, 1000);
      ifTyping = true;
    }
    if (typedChrc == null) {
      chrcIndex--;
      if (characters[chrcIndex].classList.contains("incorrect")) mistakeCount--;
      characters[chrcIndex].classList.remove("correct", "incorrect");
    } else {
      if (characters[chrcIndex].innerText === typedChrc) {
        characters[chrcIndex].classList.add("correct");
      } else {
        mistakeCount++;
        characters[chrcIndex].classList.add("incorrect");
      }
      chrcIndex++;
    }
    characters.forEach((span) => span.classList.remove("active"));
    characters[chrcIndex].classList.add("active");

    //mistakes
    mistakesTag.innerHTML = mistakeCount;
    clicksTag.innerHTML = chrcIndex - mistakeCount;
    wpmTag.innerHTML = wpm;
  } else {
    inputField.value = "";
    clearInterval(timer);
  }
}

function initTimer() {
  if (timeLeft > 0) {
    timeLeft--;
    timerTag.innerHTML = timeLeft;
  } else {
    clearInterval(timer);
  }
}

function reset() {
    randomPara();
    clearInterval(timer);
    chrcIndex = mistakeCount = ifTyping = 0;
    inputField.innerHTML = "";
    timeLeft = maxTime
    timerTag.innerHTML = timeLeft;
    mistakesTag.innerHTML = mistakeCount;
    wpmTag.innerHTML = 0;
    clicksTag.innerHTML = 0;
}



inputField.addEventListener("input", initTyping);
tryAgainBtn.addEventListener("click ", reset);
randomPara();