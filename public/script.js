// const typingTest = document.querySelector(".typing-test p");
const typingTest = document.querySelector("p.typing-test2"),
  inputField = document.querySelector(".wrapper .input-field");

const mistakesTag = document.querySelector(".mistakes span");
const timerTag = document.querySelector(".timer span");
const wpmTag = document.querySelector(".wpm span");
const clicksTag = document.querySelector(".clicks span");
const tryAgainBtn = document.querySelector(".reload-btn");

var chrcIndex = (mistakeCount = 0);

var maxTime = 30;
var timeLeft = maxTime;
var timer;
var ifTyping = false;

var toggleUnderline = true;
// highlight or toggle

const testCompletedAudio = new Audio("assets/TestDone.mp3");
const mistakeAudio = new Audio("assets/Mistake.mp3");
testCompletedAudio.volume = 0.2;
mistakeAudio.volume = 1;






function randomPara() {
  typingTest.innerHTML = "";
  sentences = input;
  var RandomIndex = Math.floor(Math.random() * sentences.length);
  sentences[RandomIndex].split("").forEach((span) => {
    var spanTag = `<span>${span}</span>`;
    typingTest.innerHTML += spanTag;
  });


  typingTest.querySelectorAll("span")[0].classList.add("activeUL");

  document.addEventListener("keydown", () => inputField.focus());
  typingTest.addEventListener("click", () => inputField.focus());
}





function initTyping() {
  // ifSettingsClicked = false;
  // settings();
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
        mistakeAudio.play();
        characters[chrcIndex].classList.add("incorrect");
      }
      chrcIndex++;
    }
    characters.forEach((span) => span.classList.remove("activeUL", "activeHL"));

    if (toggleUnderline)
      typingTest.querySelectorAll("span")[chrcIndex].classList.add("activeUL");
    else
      typingTest.querySelectorAll("span")[chrcIndex].classList.add("activeHL");

    //mistakes
    mistakesTag.innerHTML = mistakeCount;
    clicksTag.innerHTML = chrcIndex - mistakeCount;
    wpmTag.innerHTML = wpm;
  } else {
    inputField.value = "";
    if (ifTyping) {
      testCompletedAudio.play();
      ifTyping = false;
    }
    clearInterval(timer);
  }
}





function initTimer() {
  if (timeLeft > 0) {
    timeLeft--;
    timerTag.innerHTML = timeLeft;

    let wpm = Math.round(
      ((chrcIndex - mistakeCount) / 5 / (maxTime - timeLeft)) * 60
    );
    wpmTag.innerText = wpm;
  } else {
    clearInterval(timer);
  }
}




function reset() {
  
  if(ifToggleQuote){
  randomQuote();
  }else{
  randomPara();
  }

  clearInterval(timer);
  chrcIndex = mistakeCount = ifTyping = 0;
  inputField.innerHTML = "";
  timeLeft = maxTime;
  timerTag.innerHTML = timeLeft;
  mistakesTag.innerHTML = mistakeCount;
  wpmTag.innerHTML = 0;
  clicksTag.innerHTML = 0;
}

function totalTimeChange(t) {
  if (!ifTyping) {
    maxTime = timeLeft = t;
    timerTag.innerHTML = timeLeft;
  }
}

function highlight(b) {
  if (!ifTyping) {
    if (b) {
      typingTest.querySelectorAll("span")[0].classList.remove("activeHL");
      typingTest.querySelectorAll("span")[0].classList.add("activeUL");
    } else {
      typingTest.querySelectorAll("span")[0].classList.remove("activeUL");
      typingTest.querySelectorAll("span")[0].classList.add("activeHL");
    }
    toggleUnderline = b;
  }
}

var ifToggleQuote = false;
function toggleQuote(){

  if(!ifTyping)
  if(!ifToggleQuote){
    ifToggleQuote = true;
    // sentences = quote;
    // alert("random quote called");
    randomQuote();
  // reset();
    // code here
  }
  else{
    ifToggleQuote = false;
    // alert("random para called");

    randomPara();
  }
}

function randomQuote() {

  // alert("this is working");
  typingTest.innerHTML = "";
  
  fetch("https://type.fit/api/quotes")
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    sentences = data;
  });
  var RandomIndex = Math.floor(Math.random() * sentences.length);
  var string = sentences[RandomIndex];
  
  string.split("").forEach((span) => {
    var spanTag = `<span>${span}</span>`;
    typingTest.innerHTML += spanTag;
  });

  typingTest.querySelectorAll("span")[0].classList.add("activeUL");

}




inputField.addEventListener("input", initTyping);
tryAgainBtn.addEventListener("click", reset);

randomPara();
