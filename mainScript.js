"use strict"

//burger-menu for mobile version:
const burgerMenu = document.querySelector(".burger");
burgerMenu.addEventListener("click", changeBurgerMenu)
function changeBurgerMenu () {
  burgerMenu.classList.toggle('active')
  document.querySelector('.desktop_menu').classList.toggle('open');
}

//настраиваем SPA и формируем запросы на сервер для подгрузки правил тестирования и результатов теста:
const ajaxHandlerScript="https://fe.it-academy.by/AjaxStringStorage2.php";
const stringAboutRules = 'PARF_TEST_RULES';
const stringAboutResult = 'PARF_TEST_RESULT';
//запрашиваем инфо о правилах тестирования:
let rules;
async function getRules () {  
  let sp1 = new URLSearchParams();
  sp1.append('f', 'READ');
  sp1.append('n', stringAboutRules);
  sp1.append('cache', false);

  try {
    const response=await fetch(ajaxHandlerScript,{ method: 'post', body: sp1 });
    const data =await response.json();
    rules = JSON.parse(data.result);
    creatContentFromURL () //отображаем данные 
  }
  catch ( error ) {
    console.error("Не удалось загрузить данные о правилах тестирования! Ошибка: " + error);
    rules = "Упс, что-то пошло не так и мы не можем отобразить данные о правилах тестирования. Попробуйте обновить страницу.";
  }  
};  

//запрашиваем инфо о результатах тестирования:
let tableOfResults;   
async function getResults () {  
  let sp2 = new URLSearchParams();
  sp2.append('f', 'READ');
  sp2.append('n', 'PARF_TEST_RESULT');
  sp2.append('cache', false);

  try {
    const response= await fetch(ajaxHandlerScript,{ method: 'post', body: sp2 });
    const data = await response.json();    
    tableOfResults = JSON.parse(data.result);  
    creatContentFromURL (); //отображаем данные   
  }
  catch ( error ) {
    console.error("Не удалось загрузить данные о результатах тестирования! Ошибка: " + error);
    tableOfResults = "Упс, что-то пошло не так и мы не можем отобразить данные о результатах тестирования. Попробуйте обновить страницу.";
  }  
}; 

//настраиваем  SPA:  
window.onhashchange=switchToStateFromURLHash;  
var SPAState={}; // текущее состояние приложения


function changeContent (newContent) {
  const content = document.getElementById("content"); //div для отображения вариабельного контента
  const contentStorage = document.getElementById("contetnt_storage") 
  let lastActiveContent = content.children[0];  
  if (lastActiveContent) {
    contentStorage.appendChild(lastActiveContent);
  }
  content.appendChild(newContent)
}

function creatContentFromURL () {  
  let pageHTML; //отображаемый контент согласно URL страницы       
  switch ( SPAState.pagename ) {  
    case 'test':
      pageHTML = document.getElementById("test_content")
      break;      
    case 'rules':  
      let rulesText = document.getElementById("rules_text");  
      if (rules == undefined)  {     
        getRules (); //запрашиваем данные о правилах у сервера
        rulesText.innerHTML = "Пожалуйста, подождите...<br>Если информация долго не отображается, попробуйте перезагрузить страницу!";
      } 
      else {
        rulesText.innerHTML = "&#8196;&#8196;&#8196;" + rules; 
      }
      pageHTML = document.getElementById("rules_content");                   
      break;
    case 'results': 
      let rulesTable = document.getElementById("rules_table"); 
      if (tableOfResults == undefined)  {
        getResults ()//запрашиваем данные о результатах у сервера
        rulesTable.innerHTML = "Пожалуйста, подождите...<br>Если информация долго не отображается, попробуйте перезагрузить страницу!"      
      } 
      else {  
        rulesTable.innerHTML = "";     
        tableOfResults.sort( (a, b) =>  b.score-a.score ); //сортируем по оценке (от большей к меньшей)        
        for (let i = 0; i < tableOfResults.length; i++) {
          let elem = tableOfResults[i];
          let tableRow = document.createElement("div");
          tableRow.classList.add('elem_result');
          rulesTable.appendChild(tableRow)

          let spanName = document.createElement("span");
          spanName.innerHTML = elem.name + " " + elem.lastName;
          tableRow.appendChild(spanName);

          let spanScore = document.createElement("span");
          spanScore.classList.add('elem_result_score')
          spanScore.innerHTML = elem.score;
          tableRow.appendChild(spanScore);          
        }   
      };
      pageHTML = document.getElementById("results_content"); 
      break;
  } 
  if (burgerMenu.classList.contains('active')) {
    changeBurgerMenu ();
  }
  changeContent (pageHTML); 
}

function switchToStateFromURLHash() {
  var URLHash=window.location.hash;   
  var stateStr=URLHash.substr(1);
  if ( stateStr!="" ) {
    SPAState={ pagename: stateStr }
  } else { 
    SPAState={ pagename: 'test' }
    switchToState( { pagename:'test' } );// иначе показываем страницу с Тестом
  }  
  //стилизуем активную вкладку:
  let currentActivElem = document.getElementById("active_elem");  
  if (currentActivElem) { //если активная вкладка до этого была другая, то снимаем с нее этот id="active_elem"
    currentActivElem.removeAttribute("id");
  } 
  let  newActivElem = document.querySelector("." + SPAState.pagename);
  newActivElem.setAttribute("id", "active_elem");  
  creatContentFromURL (); // обновляем вариабельную часть страницы под текущее состояние  
}

function switchToState(newState) {    
  var stateStr=newState.pagename;    
  location.hash=stateStr;      
  // автоматически вызовется switchToStateFromURLHash(), т.к. закладка УРЛа изменилась
}


function animModalElem (elem, state) { //state: true - окно открывается, false - окно закрывается
  if (state) {
    setTimeout( function (){
      elem.classList.add("modalOpen");
      elem.classList.remove("modalClosed");
      elem.style.transform= "translate(-50%, -50%) translateZ(0)";}, 0) 
  }
  else {
    elem.classList.remove("modalOpen");
    elem.classList.add("modalClosed"); 
    elem.style.transform= "";  
  }    
}


//далее фиксируем начало теста. Если тест начат, то показываем сообщение о потере данных при обновлении или уходе со страницы:
let testStarted=false; //состояние теста: false - не начат, true - начат, т.е. пользователь успешно зарегистрировался
const startElem=document.getElementById('start');  //на нем стоит обработчик клика (в HTML-коде) и вызывает ф-цию testPusk

const registrModalElem = document.querySelector(".modalRegistrdWindow");
function testPusk (EO)  {
  EO=EO||window.event;
  
  const registrModalHTML= document.getElementById("modal_registr"); 
  changeContent (registrModalHTML);   
  animModalElem (registrModalElem, true)
}

function modalWindowClick(eo) {
  eo.stopPropagation();
}
window.onbeforeunload =  (EO) => {
  EO=EO||window.event;
  // если текст начался, попросим браузер задать вопрос пользователю
  if ( testStarted ) {
    EO.returnValue='При переходе на другую страницу Ваши данные и результаты будут потеряны!';
  }
};

//переключатели ссылок SPA-меню:
function switchToTestPage(eo) {
  eo = eo || window.event;
  eo.preventDefault();
  switchToState( { pagename:'test' } );
};

function switchToRulesPage(eo) {
  eo = eo || window.event;
  eo.preventDefault();
  if (testStarted){
    let resetTest = confirm("При переходе на другие вкладки результаты теста не будут сохранены! Если вы действительно хотите перейти на другую вкладку, нажмите 'OK', если нет - нажмите 'Отмена'")
    if (resetTest) {
      testStarted=false; // тест обнулен      
      switchToState( { pagename:'rules' } );
      location.reload(); //сбрасываем сохраненные данные теста
    } else {return};
  } else {
    switchToState( { pagename:'rules' } );
  }
}

function switchToResultsPage(eo) {
  eo = eo || window.event;
  eo.preventDefault();
  
  if (testStarted){  
    let resetTest = confirm ("При переходе на другие вкладки результаты теста не будут сохранены! Если вы действительно хотите перейти на другую вкладку, нажмите 'OK', если нет - нажмите 'Отмена'")
    if (resetTest) {
      testStarted=false; // тест обнулен      
      switchToState( { pagename:'results' } );
      location.reload(); //сбрасываем сохраненные данные теста     
    } else {return};  
  } else {
    switchToState( { pagename:'results' } );
  }
}
switchToStateFromURLHash();

//настраиваем аудио и вибрацию:
const zvukRightAnswer=new Audio("audio/zvuk_right.mp3");
const zvukMistakeAnswer=new Audio("audio/zvuk_mistake.mp3");
const zvukTestFinished=new Audio("audio/zvuk_finall.mp3");
const zvukPlane=new Audio("audio/zvuk_samolet.mp3");
const zvukCar=new Audio("audio/zvuk_car.mp3");
const zvuk2Cars=new Audio("audio/zvuk_2cars.mp3");
const zvukTok=new Audio("audio/zvuk_tok.mp3");
function loadZvuk(zvuk) {
  zvuk.play(); // запускаем звук
  zvuk.pause(); // и сразу останавливаем
}
function playZvuk(zvuk) {
  zvuk.currentTime=0; // в секундах
  zvuk.play();
}

function stopZvuk(zvuk) {
  zvuk.pause(); 
}
//настраиваем вибрацию:
function vibro(longFlag) {
  // есть поддержка Vibration API?
  if ( navigator.vibrate ) {
      if ( !longFlag ) {
          // вибрация 100мс
          window.navigator.vibrate(100);
      }
      else {
          // вибрация 3 раза по 100мс с паузами 50мс
          window.navigator.vibrate([50,50,200]);
      }
  }
}


//настраиваем валидацию формы для регистрации пользователя:
const form = document.forms.regist_form;    
const firstName = form.elements.firstName;
let firstNameValue;
const lastName = form.elements.lastName;
let lastNameValue;
const registFormBut = form.elements.button;
const cancelRegistr = document.getElementById("cancel_registr");


//в этом массиве будем хранить объекты с элементами формы и их функциями-валидаторами:    
let arrInfoElem = [];
let userName;
let userLastName;
function firstNameValid() {
  firstNameValue = firstName.value.trim();            
  const firstNameError = document.getElementById("firstnameError");
  const regEx = /^[а-яА-ЯёЁ]{3,12}$/;                    
  if (firstNameValue === "") {
    firstNameError.innerHTML = "Это обязательное поле! Пожалуйста, введите данные!";                       
    return false; 
  }
  if (!regEx.test(firstNameValue)) {
    firstNameError.innerHTML = "Имя должно содержать одно слово от 3 до 12 символов (только русские буквы!). Пожалуйста, введите корректные данные!";                            
    return false;
  }
  firstNameError.innerHTML = ""; //если после выскакивания ошибки пользователь ввел верные данные, то скрываем ошибку
  return true;
}
arrInfoElem.push({formElem: firstName, validFunc: firstNameValid});

function lastNameValid() {            
  lastNameValue = lastName.value.trim();
  const lastNameError = document.getElementById("lastNameError");
  const regEx = /^[а-яА-ЯёЁ]{3,15}$/;
  if (lastNameValue === "") {
    lastNameError.innerHTML = "Это обязательное поле! Пожалуйста, введите данные!";              
    return false;
  }
  if (!regEx.test(lastNameValue)) {
    lastNameError.innerHTML = "Фамилия должна содержать одно слово от 3 до 15 символов (только русские буквы!). Пожалуйста, введите корректные данные!";           
    return false;
  }
  lastNameError.innerHTML = "";
  return true;
}
arrInfoElem.push({formElem: lastName, validFunc: lastNameValid});

firstName.addEventListener("blur", firstNameValid);
lastName.addEventListener("blur", lastNameValid);

//функция-валидатор всей формы: 
function submitValid(EO) {
  EO=EO||window.event;
  EO.preventDefault();

  let validResult = true; //форма заполнена верно, false - есть ошибки
  //сначала выводим все возможнные ошибки для неверно заполненых полей на страницу:
  for (let i=0; i<arrInfoElem.length; i++) {            
    arrInfoElem[i].validFunc(); 
  }            
  //потом находим первую функцию-валидатор, которая нашла ошибку в форме:
  for (let i=0; i<arrInfoElem.length; i++) {             
    if ( !arrInfoElem[i].validFunc() ) { 
      validResult = false;
      arrInfoElem[i].formElem.focus();
      EO.preventDefault();      
      break;
    }; 
  };
  //если все ок, то обновляем вариабельный контент и запускаем слайдер с вопросами теста:
  if (validResult) {
    EO.preventDefault();
    //если регистрация успешная, то запоминаем данные о пользователе
    userName = firstNameValue;
    userLastName = lastNameValue;

    //загружаем нужные звуки:
    loadZvuk(zvukRightAnswer);
    loadZvuk(zvukMistakeAnswer);
    loadZvuk(zvukTestFinished);    
    loadZvuk(zvukPlane);
    loadZvuk(zvukCar);
    loadZvuk(zvuk2Cars);  
    loadZvuk(zvukTok);      
    testStarted=true;        

    animModalElem (registrModalElem, false)
    const openModalElem = document.querySelector(" #modal_registr .modalClosed");  
    closeModalElem (openModalElem, createSlider)
     
  }
}
 
//для анимированного закрытия модальных окон и смены вариабельного контента
function closeModalElem (elem, nextStep, update) { 
    let promise = new Promise( (resolve) => {          
      elem.addEventListener("transitionend", ()=>{resolve(0)} );
    })
    .then( result => {
      elem.classList.remove("modalClosed");
      nextStep();   
      if (update) {
        location.reload(); //сбрасываем все сохраненные данные  
      }
    }); 
}


//ставим обработчки для валидации всей формы при нажатии на кнопку "Зарегистрироваться" 
registFormBut.addEventListener("click", submitValid);
//если пользователь передумал регистрироваться на тест, то меняем вариабельный контент обратно на "test"
cancelRegistr.addEventListener("click", (EO) => {
  animModalElem (registrModalElem, false);   
  const openModalElem = document.querySelector("#modal_registr .modalClosed");  
  closeModalElem (openModalElem, creatContentFromURL, false);  
})  




//создаем слайдер вопросов:
let currQuestyoin = 0; //текущий вопрос
let lastQuestyion = 0; //вопрос, который только что закрыли 
const cntQuestions = 10; //количество всего вопросов

function createSlider () {  
  currQuestyoin = 1;  //текущий вопрос, по умолчанию сразу открываем первый    
  let sliderWidth; //ширина слайдера (изначально у нас задана только ширина блока #slider, остальное в слайдере под нее подстраивается)
  const sliderNav = document.getElementById("slider_nav");
  const slider = document.getElementById("slider");
  const sliderLine = document.getElementById("slider_line");
  const sliderItem = document.querySelectorAll(".slider_item");  


  //настраиваем result_bar
  let resultsBar = document.createElement("div")
  resultsBar.setAttribute("id", "resultsBar")
  for (let i = 1; i <= cntQuestions; i ++) {
    let resultsBarItem = document.createElement("div")
    resultsBarItem.setAttribute("id", "results_bar_item"+i)
    resultsBar.appendChild(resultsBarItem);
  }
  sliderNav.insertBefore(resultsBar, slider)
  document.querySelector("#results_bar_item" + currQuestyoin).classList.add("activeBarElem");  
  changeContent (sliderNav);
  setButtPromise ();  //настройка кнопок "Ответить"
  

  //назначаем ширину элементам слайдера (в зависимости от ширины блока #slider)
  function resizeSlider () {
    sliderLine.style.transition = "none"; //убираем плавный переход
    sliderWidth = Math.round(parseFloat(window.getComputedStyle(slider).width));
    for (let i = 0; i < sliderItem.length; i++) {
      sliderItem[i].style.width = sliderWidth + "px";
    }
    sliderLine.style.width = sliderWidth*cntQuestions + "px";
    sliderLine.style.left = -(currQuestyoin-1)*sliderWidth + "px";    
    sliderLine.style.transition = ""; //возвращаем плавный переход  
  }

  resizeSlider (); //сразу позиционируем все элементы под нужную ширину
  window.addEventListener("resize", resizeSlider); 
    

  // настраиваем "листание" слайдера кнопками или свапом на моб устройстве:
  function showSlide (direction) { //direction: 'next' or 'prev'
    document.querySelector(".activeBarElem").classList.remove("activeBarElem");
    lastQuestyion = currQuestyoin;
    if (direction == "next") {currQuestyoin++;}
    else {currQuestyoin--;}
    document.querySelector("#results_bar_item" + currQuestyoin).classList.add("activeBarElem");
    completeAnim(lastQuestyion); //для завершения ненужных анимаций при их наличии
  }


  //подключаем кнопки "вперед" и "назад" для слайдера:
  const sliderNextBut = document.getElementById("slider_next_but");
  const sliderPrevBut = document.getElementById("slider_prev_but");
  let offset = 0; //смещение от левого края;

  sliderPrevBut.onclick = function () {   
    offset =  Math.abs(parseFloat(window.getComputedStyle(sliderLine).left)); 
    if ( (offset > 0) && (offset%sliderWidth == 0) ) {
      showSlide("prev");     
      offset -= sliderWidth;      
      sliderLine.style.left= -offset + "px"; 
    }    
  };
  sliderNextBut.onclick = function () {     
    offset =  Math.abs(parseFloat(window.getComputedStyle(sliderLine).left)); 
    if ((offset < (sliderWidth*cntQuestions - sliderWidth) ) && (offset%sliderWidth == 0) ) {
      showSlide("next");
      offset += sliderWidth;      
      sliderLine.style.left= -offset + "px";
    }   
  }; 
  
  //обрабатываем жест свайп по элементам слайдера:
  sliderLine.addEventListener("touchstart", pointerDownSlider);    
  //кооординаты начала указателя:
  let x0 = null;
  let y0 = null;
  let startLeftPos;
  let swipeMode; // если false, то свайпа нет и можно делать новый свайп, если true, то свайп сейчас уже идет и еще один свайп сделать пока нельзя

  function pointerDownSlider(EO) {
    EO = EO || window.event;
    x0 = EO.touches[0].clientX;
    y0 = EO.touches[0].clientY;

    startLeftPos = parseFloat(window.getComputedStyle(sliderLine).left);
    swipeMode = false; 

    let clickElem = EO.target; 
    if (!clickElem.classList.contains("drag_elem")) {
      document.addEventListener("touchmove", pointerMoveSlider);
      document.addEventListener("touchend", pointerUpSlider); 
    }                
  }
  function pointerMoveSlider(EO) {
    EO = EO || window.event;
    if (!swipeMode) {
      let x1 = EO.touches[0].clientX;
      let y1 = EO.touches[0].clientY;

      let xOffset = x1 - x0;
      let yOffset = y1 - y0;
      
      //реагировать будем на свайп влево/вправо:
      if ( Math.abs(xOffset) > Math.abs(yOffset)) {
        swipeMode = true;
        if ((xOffset < 0 && startLeftPos > -(sliderWidth*cntQuestions - sliderWidth)) && (startLeftPos%sliderWidth == 0)) { 
          EO.preventDefault();
          showSlide("next");           
          sliderLine.style.left = startLeftPos - sliderWidth + "px";           
        }
        else if ((xOffset > 0 && startLeftPos < 0) && (startLeftPos%sliderWidth == 0)) {
          EO.preventDefault();
          showSlide("prev");            
          sliderLine.style.left = startLeftPos + sliderWidth  + "px";            
        }        
      }
    }  
  };
  function pointerUpSlider(EO) {
    EO = EO || window.event;
    x0 = null;
    y0 = null;
    swipeMode = false;
    document.removeEventListener("touchmove", pointerMoveSlider)
    document.removeEventListener("touchend", pointerUpSlider)
  };



  //настраиваем графику и анимации:
  //если в вопросе есть какая-то анимация, то таймер будет в переменной timerAnim
  //когда вопрос с анимацией перелистывается, то отключаем этот таймер и освобождаем ресурсы (если надо) в функции completeAnim()
  let timerAnim = null; 
  //пространство имён для SVG-тегов:
  const xmlSVG ="http://www.w3.org/2000/svg";
  //пространство имен для языка ссылок в SVG:
  const xmlSVGlinks ='http://www.w3.org/1999/xlink'


  //2 вопрос (движение самолета по окружности):   
  function creatAmin2 () {     
    const svgTag2Quest = document.getElementById("svg_quest2");  
    const svgWidth = 500;
    const svgWHeigth = 375;
    svgTag2Quest.setAttribute("viewBox", "0 0 " + svgWidth + " " +  svgWHeigth);

    
    //создаем и стилизуем солнце:
    let sun = document.createElementNS(xmlSVG, "g");
    svgTag2Quest.appendChild(sun);
    let sunRadius = 25
    let sunCircle = document.createElementNS(xmlSVG, "circle");
    sunCircle.setAttribute("cx", svgWidth/2);
    sunCircle.setAttribute("cy", svgWHeigth/2);
    sunCircle.setAttribute("r", sunRadius);
    sunCircle.setAttribute("fill", 'rgb(243,193,21)');
    sun.appendChild(sunCircle);

    //создаем и стилизуем лучи:
    let angleSunRay = 0;
    const lengthSunRay = 20;
    const cntSunRay = 8
    const piesoOfAbgle = 360/cntSunRay
    const sunRayWidth = 6;
    const sunRayHeight = 20;
    for (let i=0; i<cntSunRay; i++){
      let sunRay = document.createElementNS(xmlSVG, "rect");
      sunRay.setAttribute("width", 6);
      sunRay.setAttribute("height", 20);
      sunRay.setAttribute("x", (svgWidth - sunRayWidth)/2);
      sunRay.setAttribute("y", svgWHeigth/2-sunRadius-sunRayHeight - 10);  
      sunRay.setAttribute("rx", 3);
      sunRay.setAttribute("ry", 3); 
      sunRay.setAttribute("fill", 'rgb(243,193,21)');
      sunRay.setAttribute("сlass", 'sunRay');
      sun.appendChild(sunRay);  
      angleSunRay += piesoOfAbgle
      sunRay.setAttribute("transform", "rotate( "+ angleSunRay + " " + svgWidth/2 + " " +svgWHeigth/2 + ")" )
    }

    //создаем и стилизуем самолет:
    let plane = document.createElementNS(xmlSVG, "image");
    let radiysPlane = document.forms.question2_set.elements.radius_plane.value
    const imageWidth = 60;
    const imageHeight = 45;     
    plane.setAttribute("x", svgWidth/2 - imageWidth/2);
    plane.setAttribute("y", svgWHeigth/2 - radiysPlane - imageHeight/2);
    plane.setAttribute("width", imageWidth);
    plane.setAttribute("height", imageHeight);
    plane.setAttribute("id", "plane");
    plane.setAttributeNS(xmlSVGlinks,"href","image/plane0.jpg");   
    svgTag2Quest.appendChild(plane);
    
           
    //отслеживание состояние кнопок on/off (вкл и выкл анимацию:)      
    let anglePlane = 0; //стартовый угол самолета
    let angleSun = 0; //стартовый угол солнца   
    function rotateAnim2() {    
      let pieseOfAnglePlane = 0.5; //шаг изменения угла поворота самолета (в градусах)
      anglePlane +=pieseOfAnglePlane;
      plane.setAttribute("transform", "rotate( "+ anglePlane + " " + svgWidth/2 + " " +svgWHeigth/2 + ")" );
      let pieseOfAngleSun = 0.05; //шаг изменения угла поворота солнца(в градусах)
      angleSun +=pieseOfAngleSun;
      sun.setAttribute("transform", "rotate( "+ angleSun + " " + svgWidth/2 + " " +svgWHeigth/2 + ")" );           
      
      timerAnim = requestAnimationFrame(rotateAnim2)
    }
      
    function stopRotateAnim2() {   
      let offRotate = document.getElementById("value2_off");
      offRotate.click()//меняем стили
      cancelAnimationFrame(timerAnim);
    }

    function animPlane() {       
      let currState = document.forms.question2_set.elements.state_2quest.value 
      if(currState == "on") {
        rotateAnim2();
        playZvuk(zvukPlane)       
      }
      else {
        stopRotateAnim2()
        stopZvuk(zvukPlane)
      }     

    }  
    const animPlaneState = document.querySelector("#question2_set div:last-child"); 
    animPlaneState.addEventListener("change", animPlane);

    //отслеживание отдаленности самолета от солнца:    
    const animPlaneRadius = document.querySelector("#question2_set div:first-child"); 
    animPlaneRadius.addEventListener("change", changePlaneRadius);
    function changePlaneRadius(){    
      let radiysPlane = document.forms.question2_set.elements.radius_plane.value;
      plane.removeAttribute("y");
      plane.setAttribute("y", svgWHeigth/2 - radiysPlane - 45/2);
    }  
  }
  creatAmin2 ();



  //3 вопрос (скольжение тела по гориз плоскости):   
  function creatAmin3 () {     
    const svgTag3Quest = document.getElementById("svg_quest3");  
    const svgWidth = 500;
    const svgWHeigth = 280;
    svgTag3Quest.setAttribute("viewBox", "0 0 " + svgWidth + " " +  svgWHeigth);
    
    //создаем и стилизуем землю:
    let land3 = document.createElementNS(xmlSVG, "rect");
    svgTag3Quest.appendChild(land3);    
    land3.setAttribute("width", svgWidth);
    land3.setAttribute("height", svgWHeigth*0.4);
    land3.setAttribute("x", 0);
    land3.setAttribute("y", svgWHeigth*0.6);  
    land3.setAttribute("rx", 5);
    land3.setAttribute("ry", 5); 
    land3.setAttribute("fill", 'url(#LG1)');
    land3.setAttribute("id", 'land3');

    //создаем и стилизуем тело:  
    let bodyWidth = document.forms.question3_set.elements.body_size.value; //по умолчанию 40
    let body3 = document.createElementNS(xmlSVG, "rect");
    svgTag3Quest.appendChild(body3);    
    body3.setAttribute("width", bodyWidth);
    body3.setAttribute("height", bodyWidth*0.75);
    body3.setAttribute("x", (svgWidth - bodyWidth)/2);
    body3.setAttribute("y", (svgWHeigth*0.6 - bodyWidth*0.75));  
    body3.setAttribute("rx", 5);
    body3.setAttribute("ry", 5); 
    body3.setAttribute("fill", '#222222');
    body3.setAttribute("fill", 'url(#LG2)');
    body3.setAttribute("id", 'body3'); 
    body3.setAttribute("class", "drag_elem");
    body3.setAttribute("draggable", "true");
          
                  
    //отслеживание размеров тела:    
    const bodySizeSet= document.querySelector("#question3_set div"); 
    bodySizeSet.addEventListener("change", changeBodySize);

    function removeAttributes(element, ...attrs) {
      attrs.forEach(attr => element.removeAttribute(attr))
    }
    function changeBodySize(){  
      let bodySize = document.forms.question3_set.elements.body_size.value;      
      removeAttributes( body3, "width", "height", "x", "y")
      body3.setAttribute("width", bodySize);
      body3.setAttribute("height", bodySize*0.75);
      body3.setAttribute("x", (svgWidth - bodySize)/2);
      body3.setAttribute("y", (svgWHeigth*0.6 - bodySize*0.75));
    }  

    //чтобы перетаскивать тело по гориз плоскости:  
    //начальные координаты указателя и значение координаты X у тела:
    let ckickX0, startPosSBody; 
    body3.addEventListener("pointerdown", dragStartFunc);

    function dragStartFunc(eo) {
      eo=eo||window.event;  
      eo.preventDefault();
      body3.style.transitionDuration = '0s'; //чтобы перемещалось сразу, а не плавно 
         
      ckickX0 = eo.pageX; 
      startPosSBody = parseFloat(body3.getAttribute("x"))
      
      window.addEventListener("pointermove", dragMoveFunc);
      window.addEventListener("pointerup", dragEndFunc);
    }

    function dragMoveFunc (eo) { 
      eo=eo||window.event; 
      eo.preventDefault();            
      let clickX1 = eo.pageX; //текущее положение указателя во время движения
      let offsetXBody = clickX1 - ckickX0; //смещение указателя во время движения

      let newPosXBody;   
      let bodySize = document.forms.question3_set.elements.body_size.value;
      if (bodySize == "70") {
        newPosXBody = startPosSBody + offsetXBody;
      }
      else {
        newPosXBody = startPosSBody + offsetXBody/3;
      }
      let bodyWidth = parseFloat(body3.getAttribute("width"))
      if (newPosXBody >= 0 && newPosXBody <= (svgWidth-bodyWidth)) {
        body3.removeAttribute("x");
        body3.setAttribute("x", newPosXBody); 
      }                
    }

    function dragEndFunc(eo) {
      eo=eo||window.event;      
      eo.preventDefault();   

      //возвращаем плавно и освобождаем ресурсы:
      body3.style.transitionDuration = ''; 
      window.removeEventListener("pointermove", dragMoveFunc);
      window.removeEventListener("pointerup", dragEndFunc);
    } 
  }
  creatAmin3 ();  



  // 5 анимация (движение авто с разной скоростью):
  function  createAnim5 () {
    //данные с информацией об элементах:
    let cnvsH = {
      width : 500,
      height: 150  
    }   
    let carH = {
      width : 80,
      height: 30.4, 
      x: 0,
      y: cnvsH.height - 30.4,
      redColor: "image/red_car.png",
      blueColor: "image/blue_car.png",
      greyColor: "image/grey_car.png",
    }         
    let pointsH =  {      
      radius: 4,
      x1: carH.width + 4,
      x2: cnvsH.width - 4,
      y: cnvsH.height - 4
    }
    let distansH = {
      width : cnvsH.width - carH.width - pointsH.radius*4,
      lineWidth: 2,
      x0: carH.width + pointsH.radius*2,
      x1: cnvsH.width - pointsH.radius*2,
      y: cnvsH.height - pointsH.radius
    } 
    let dashesH = {
      height: 5,      
      x10: distansH.x0 + distansH.width*0.33,
      x20: distansH.x0 + distansH.width*0.66,

      y0: cnvsH.height - pointsH.radius,
      y1: cnvsH.height - pointsH.radius - 5,
    } 
       
    let imgCar = new Image();
    function changeColor () {
      let currColor = document.forms.question5_set.elements.car_color.value;
      if (currColor == 1) {
        imgCar.src = carH.redColor;      
      }
      else if (currColor == 2) {
        imgCar.src = carH.blueColor;      
      }
      else if (currColor == 3) {
        imgCar.src = carH.greyColor;      
      };   
      imgCar.onload = drowAnim; 
    }   
    changeColor ();             

    function drowAnim() { 
      const animField = document.getElementById("CVS5Anim");  
      animField.width = cnvsH.width;
      animField.height = cnvsH.height;  

      let context = animField.getContext("2d");  
      context.drawImage(imgCar, carH.x, carH.y, carH.width, carH.height);
      context.save();

      context.fillStyle = "rgb(99,99,99)";
      context.strokeStyle = "rgb(99,99,99)";
      
      context.arc(pointsH.x1, pointsH.y , pointsH.radius, 0, Math.PI*2, false) 
      context.fill();   
      context.arc(pointsH.x2, pointsH.y , pointsH.radius, 0, Math.PI*2, false) 
      context.fill();

      context.lineWidth = distansH.lineWidth;
      context.beginPath();
      context.moveTo(distansH.x0, distansH.y);
      context.lineTo(distansH.x1, distansH.y);
      context.stroke(); 

      context.beginPath();
      context.moveTo(dashesH.x10, dashesH.y0);
      context.lineTo(dashesH.x10, dashesH.y1);
      context.stroke();

      context.beginPath();
      context.moveTo(dashesH.x20, dashesH.y0);
      context.lineTo(dashesH.x20, dashesH.y1);
      context.stroke();

      context.restore();
    }  
    
    //запуск авто:
    const carState = document.querySelector("#question5_set div:last-child"); 
    let offDrive = document.getElementById("value5_off");
    let onDrive = document.getElementById("value5_on");
    carState.addEventListener("change", carDriveFunc); 

    function carDriveFunc () {   
      let carDrive  = document.forms.question5_set.elements.state_5quest.value;

      var changeColorButs = document.querySelectorAll("#question5_set div:first-child  label");
      var changeColorInputs = document.querySelectorAll("#question5_set div:first-child  input");
        
      if (carDrive == "on") {
        playZvuk(zvukCar);

        function drive () {
          //если авто едет, то менять цвет авто уже нельзя:        
          for (let i = 0; i < changeColorButs.length; i++) {
            changeColorButs[i].classList.add("disabled");
            changeColorInputs[i].setAttribute("disabled", "")
          }

          let speed; //скорость автомобиля   
          if (carH.x < dashesH.x10 - carH.width) {
            speed = (distansH.width*0.33)/(5*60) //первый участок необходимо пройти за 5сек
            zvukCar.volume=0.5;
          }
          else if (carH.x < dashesH.x20 - carH.width) {
            speed = (distansH.width*0.33)/(3*60) //первый участок необходимо пройти за 3сек  
            zvukCar.volume=0.8;    
          }
          else if (carH.x < pointsH.x2 - carH.width) {
            speed = (distansH.width*0.33)/(2*60) //первый участок необходимо пройти за 3сек   
            zvukCar.volume=1;  
          }
          else { //Если авто доехало до конечной точки:
            offDrive.click();
            onDrive.getAttribute("disabled", "")
            return;
          }
          carH.x = carH.x + speed; 
          drowAnim();      
          timerAnim = requestAnimationFrame (drive);   
        }
        drive ();
      }     
      else {        
        cancelAnimationFrame(timerAnim); 
        stopZvuk(zvukCar); 
        setTimeout ( function () {
          carH.x = 0;
          //возвращаем возможность менять цвет машины:
          for (let i = 0; i < changeColorButs.length; i++) {
            changeColorButs[i].classList.remove("disabled");
            changeColorInputs[i].removeAttribute("disabled")
          }         
          drowAnim();
          onDrive.removeAttribute("disabled")
        }, 1200)    
               
      }
    }
    //отслеживание цвета машины:    
    const carColor = document.querySelector("#question5_set div:first-child"); 
    carColor.addEventListener("change", changeColor);   
  }
  createAnim5 ();  
  

  //анимация  6 вопрос - уточка на воде 
  let duckStartY, durkFinishFunc

  function creatAmin6 () {     
    const svgTag6Quest = document.getElementById("svg_quest6");  
    const svgWidth = 500;
    const svgHeigth = 250;
    svgTag6Quest.setAttribute("viewBox", "0 0 " + svgWidth + " " +  svgHeigth);
    
    //создаем и стилизуем озеро:
    let lake = document.createElementNS(xmlSVG, "rect");
    let lakeHeight = svgHeigth*0.6; 
    svgTag6Quest.appendChild(lake);    
    lake.setAttribute("width", svgWidth);
    lake.setAttribute("height", lakeHeight);
    lake.setAttribute("x", 0);
    lake.setAttribute("y", svgHeigth - lakeHeight);  
    lake.setAttribute("rx", 5);
    lake.setAttribute("ry", 5); 
    lake.setAttribute("fill", 'url(#LG3)');
    lake.setAttribute("id", 'lake');

    //создаем и стилизуем утку:
    let duck = document.createElementNS(xmlSVG, "image");    
    const duckWidth = 100;
    const duckHeight = 80;   
    const duckPosStartY =  svgHeigth - lakeHeight - duckHeight*0.6; 
    duckStartY = duckPosStartY
    duck.setAttribute("x", svgWidth/2 - duckWidth/2);
    duck.setAttribute("y", duckPosStartY);
    duck.setAttribute("width", duckWidth);
    duck.setAttribute("height", duckHeight);
    duck.setAttribute("id", "duck");
    duck.setAttribute("class", "drag_elem");
    duck.setAttributeNS(xmlSVGlinks,"href","image/duck.png");   
    svgTag6Quest.appendChild(duck);

    //чтобы перетаскивать тело по гориз плоскости:  
    //начальные координаты указателя и значение координаты X у тела:
    let ckickX0, ckickY0, startPosXDuck, startPosYDuck; 
   

    duck.addEventListener("pointerdown", dragStartFunc);

    function dragStartFunc(eo) {
      eo=eo||window.event;  
      eo.preventDefault();
      duck.style.transition = 'all 0s ease-out'; //чтобы перемещалось сразу, а не плавно          
      ckickX0 = eo.pageX; 
      ckickY0 = eo.pageY; 
      startPosXDuck = parseFloat(duck.getAttribute("x"));
      startPosYDuck = parseFloat(duck.getAttribute("y"))      
      window.addEventListener("pointermove", dragMoveDuckFunc);
      window.addEventListener("pointerup", dragEndDuckFunc);
    }

    function dragMoveDuckFunc (eo) { 
      eo=eo||window.event; 
      eo.preventDefault();  
          
      let clickX1 = eo.pageX; //текущее положение указателя во время движения по Х
      let clickY1 = eo.pageY; //текущее положение указателя во время движения по У

      let offsetXDuck = clickX1 - ckickX0; //смещение указателя во время движения по Х
      let offsetYDuck = clickY1 - ckickY0; //смещение указателя во время движения по У

      let newPosXDuck, newPosYDuck;  
      newPosXDuck = startPosXDuck + offsetXDuck;
      newPosYDuck = startPosYDuck + offsetYDuck;

      if (newPosXDuck >= 0 && newPosXDuck <= (svgWidth-duckWidth)) {
        duck.removeAttribute("x");
        duck.setAttribute("x", newPosXDuck); 
      }         
      if (newPosYDuck >= duckPosStartY && newPosYDuck <= (svgHeigth-duckHeight)) {
        duck.removeAttribute("y");
        duck.setAttribute("y", newPosYDuck); 
      }  
    }

    function dragEndDuckFunc(eo) {
      eo=eo||window.event;      
      eo.preventDefault();   
      //возвращаем плавно и освобождаем ресурсы:
      duck.style.transition = ''; 
      if ( parseFloat(duck.getAttribute("y")) > duckPosStartY) {
        durkFloatFunc ();
      }      
      window.removeEventListener("pointermove", dragMoveDuckFunc);
      window.removeEventListener("pointerup", dragEndDuckFunc);
    } 


    let angleRotateDuck = 0
    function durkFloatFunc () {
      duck.style.transition = 'all 0s ease-out'; //чтобы перемещалось сразу, а не плавно 

      const pieceOfFloat = 0.5; 
      const pieceOfRotate = 1; 
      const currX = parseFloat(duck.getAttribute("x"));                  
      const currY = parseFloat(duck.getAttribute("y"));

      let rotateX = currX + duckWidth*0.5;
      let rotateY = currY + duckHeight * 0.5      
      duck.setAttribute("transform-origin", rotateX + " " +  rotateY);     

      let newY = currY - pieceOfFloat;
      angleRotateDuck += pieceOfRotate;
      if (angleRotateDuck < 50) {
        duck.style.transform = `rotate(${angleRotateDuck}deg)`   
      }       
      duck.removeAttribute("y");
      duck.setAttribute("y", newY);
      
      if (newY > duckPosStartY ) {      
        timerAnim = requestAnimationFrame(durkFloatFunc);
      }
      else {
        angleRotateDuck = 0;        
        duck.style.transition = "" // вызвращаем обычные стили для transition-duration 
        duck.style.transform = `rotate(0deg)`   

        cancelAnimationFrame(timerAnim);
      }   

      durkFinishFunc = durkFloatFunc;
    }
  }
  creatAmin6 ();


  //9 анимация (электрическая цепь):
  function  createAnim9 () {
    //данные с информацией об элементах:
    let cnvsH = {
      width : 500,
      height: 270  
    }  

    let pointsH =  {      
      radius0: 5,
      radius1: 3,
      x1: 10,
      x2: cnvsH.width - 10,
      x3: 100,
      x4: 400,
      y: cnvsH.height/2 - 5
    }

    let lineH = {
      x0: pointsH.x1 + pointsH.radius0,
      x1: cnvsH.width - 10 - pointsH.radius0,
      y: pointsH.y,
    }

    let rectH =  {   
      width : pointsH.x4 - pointsH.x3,
      height: 150, 
      x: pointsH.x3 ,
      y: pointsH.y - 150/2     
    }
    let rectResist1H =  {   
      width : 100,
      height: 30, 
      x: 200 ,
      y: rectH.y - 30/2     
    }

    let rectResist2H =  {   
      width : 100,
      height: 30, 
      x: 200 ,
      y: rectH.y + rectH.height  - 30/2     
    }

    let textResis1H =  {
      text: "8 ОМ",
      x: cnvsH.width / 2,
      y: rectResist1H.y + rectResist1H.height/2
    }

    let textResis2H =  {
      text: "12 ОМ",
      x: cnvsH.width / 2,
      y: rectResist2H.y + rectResist2H.height/2
    }

    let currPoint1H =  {
      r: 5,
      x: pointsH.x1,
      y: lineH.y,
      speed: 0.5
    }

    let currPoint2H =  {
      r: 5,
      x: pointsH.x1,
      y: lineH.y,
      speed: 0.5
    }
           
   

    function drowAnim9(currOn) { 
      const animField = document.getElementById("CVS9Anim");  
      animField.width = cnvsH.width;
      animField.height = cnvsH.height;  

      let context = animField.getContext("2d");  
      context.save();         

      context.fillStyle = "rgb(99,99,99)";
      context.strokeStyle = "rgb(99,99,99)";  
      context.beginPath();    
      context.arc(pointsH.x1, pointsH.y , pointsH.radius0, 0, Math.PI*2, false) 
      context.fill();  
      context.beginPath();
      context.arc(pointsH.x2, pointsH.y , pointsH.radius0, 0, Math.PI*2, false) 
      context.fill();     

      context.lineWidth = 1;      
      
      context.beginPath();
      context.moveTo(lineH.x0, lineH.y);
      context.lineTo(lineH.x1, lineH.y);
      context.stroke();

      context.fillStyle = "white";
      context.strokeRect(rectH.x, rectH.y, rectH.width, rectH.height);
      context.fillRect(rectH.x, rectH.y, rectH.width, rectH.height);   
      
      context.fillStyle = "rgb(99,99,99)";
      context.beginPath();
      context.arc(pointsH.x3, pointsH.y , pointsH.radius1, 0, Math.PI*2, false) 
      context.fill();
      context.beginPath();
      context.arc(pointsH.x4, pointsH.y , pointsH.radius1, 0, Math.PI*2, false) 
      context.fill();

    
      if(currOn) {
        context.fillStyle = "rgb(249,217,11)";  
        context.beginPath(); 
        context.arc(currPoint1H.x, currPoint1H.y, currPoint1H.r, 0, Math.PI*2, false) 
        context.fill();  
        context.beginPath();
        context.arc(currPoint2H.x, currPoint2H.y, currPoint2H.r, 0, Math.PI*2, false) 
        context.fill();       
      }      

      if (currPoint1H.x > rectResist1H.x && currPoint1H.x < rectResist1H.x + rectResist1H.width) {
        context.fillStyle = "rgb(249,217,11)";
      }
      else {
        context.fillStyle = "rgb(228,228,228)"; 
      }
           
      context.strokeRect(rectResist1H.x, rectResist1H.y, rectResist1H.width, rectResist1H.height);
      context.fillRect(rectResist1H.x, rectResist1H.y, rectResist1H.width, rectResist1H.height);

      context.strokeRect(rectResist2H.x, rectResist2H.y, rectResist2H.width, rectResist2H.height);
      context.fillRect(rectResist2H.x, rectResist2H.y, rectResist2H.width, rectResist2H.height);

            
      context.fillStyle = 'rgb(99,99,99)';   
      context.font = `normal 16px Open Sans`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(textResis1H.text, textResis1H.x, textResis1H.y);  
      context.fillText(textResis2H.text, textResis2H.x, textResis2H.y);

      context.restore();
    } 
    drowAnim9(false)
    
    //пускаем ток:
    const electricСurrentState = document.querySelector("#question9_set div"); 
    let offState = document.getElementById("value9_off");
    let onState = document.getElementById("value9_on");
    electricСurrentState.addEventListener("change", goСurrentFunc); 

    function goСurrentFunc () {   
      let currentState  = document.forms.question9_set.elements.state_9quest.value;        
      if (currentState == "on") {
        playZvuk(zvukTok);
        function currentOn () { 
          let speedCurr = currPoint1H.speed; 

          if (currPoint1H.x < rectH.x && currPoint2H.x < rectH.x ) {
            currPoint1H.x = currPoint1H.x + speedCurr; 
            currPoint2H.x = currPoint2H.x + speedCurr;                
          }     
          else if (currPoint1H.y > rectH.y && currPoint2H.x < rectH.y + rectH.height ) {
            currPoint1H.y = currPoint1H.y - speedCurr; 
            currPoint2H.y = currPoint2H.y + speedCurr;                 
          }           
          else if (currPoint1H.x < rectH.x + rectH.width && currPoint2H.x < rectH.x + rectH.width ) {
            currPoint1H.x = currPoint1H.x + speedCurr; 
            currPoint2H.x = currPoint2H.x + speedCurr;                 
          }
          else if (currPoint1H.y < rectH.y + rectH.height/2 && currPoint2H.y > rectH.y + rectH.height/2 ) {
            currPoint1H.y = currPoint1H.y + speedCurr; 
            currPoint2H.y = currPoint2H.y - speedCurr;                   
          }
          else if (currPoint1H.x < pointsH.x2 && currPoint2H.x < pointsH.x2 ) {
            currPoint1H.x = currPoint1H.x + speedCurr; 
            currPoint2H.x = currPoint2H.x + speedCurr;                  
          }
          else { //Если ток дошел до конечной точки:
            offState.click();
            onState.getAttribute("disabled", "")   
            return         
          }  
          drowAnim9(true); 
          timerAnim = requestAnimationFrame (currentOn);  
        }
        currentOn ();
      }     
      else {        
        cancelAnimationFrame(timerAnim); 
        stopZvuk(zvukTok);
        setTimeout ( function () {
          currPoint1H.x = lineH.x0 - 2;
          currPoint1H.y = lineH.y;   
          
          currPoint2H.x = lineH.x0 - 2;
          currPoint2H.y = lineH.y;  
          drowAnim9(false);
          onState.removeAttribute("disabled")
        }, 1200)  
               
      }
    }

  }
  createAnim9 ();        


  //10 анимация (движение двух авто):
  function  createAnim10 () {
    //данные с информацией об элементах:
    let cnvsH = {
      width : 500,
      height: 150  
    }   
    let car1H = {
      width : 80,
      height: 40, 
      x: 0,
      y: cnvsH.height - 40,
      speed: 0.8,
      url: "image/yellow_car.png",  
    }  
    let car2H = {
      width : 80,
      height: 40, 
      x: cnvsH.width - 80,
      y: cnvsH.height - 40,
      speed:  0.6,
      url: "image/red_car2.png",  
    } 

    let pointsH =  {      
      radius: 4,
      x1: car1H.width + 4,
      x2: cnvsH.width - car2H.width - 4,
      y: cnvsH.height - 4
    }
    let distansH = {
      width : cnvsH.width - car1H.width - car2H.width - pointsH.radius*4,
      lineWidth: 2,
      x0: car1H.width + pointsH.radius*2,
      x1: cnvsH.width - car2H.width - pointsH.radius*2,
      y: cnvsH.height - pointsH.radius
    } 
    let dashesH = {
      height: 5,      
      x10: distansH.x0 + distansH.width*0.33,
      x20: distansH.x0 + distansH.width*0.66,

      y0: cnvsH.height - pointsH.radius,
      y1: cnvsH.height - pointsH.radius - 5,
    } 
        
    let imgCar1 = new Image();
    let imgCar2 = new Image();

    imgCar1.src = car1H.url;
    imgCar2.src = car2H.url;

    function createPromise10(img) { 
      return new Promise( resolve => {     
        img.addEventListener("load", ()=>{resolve(1)} );    
      });
    }    
    
    let promise10_1 = createPromise10 (imgCar1);
    let promise10_2 = createPromise10 (imgCar2)
          
    Promise.all( [promise10_1, promise10_2])
    .then( result => {
      drowAnim10();
    })
    .catch( error => {
      console.log("Promise.all отклонён с ошибкой: "+error);
    })  


    function drowAnim10() { 
      const animField = document.getElementById("CVS10Anim");  
      animField.width = cnvsH.width;
      animField.height = cnvsH.height;  

      let context = animField.getContext("2d");  
      context.save();

      context.drawImage(imgCar1, car1H.x, car1H.y, car1H.width, car1H.height);
      context.drawImage(imgCar2, car2H.x, car2H.y, car2H.width, car2H.height);      

      context.fillStyle = "rgb(99,99,99)";
      context.strokeStyle = "rgb(99,99,99)";      
      context.arc(pointsH.x1, pointsH.y , pointsH.radius, 0, Math.PI*2, false) 
      context.fill();   
      context.arc(pointsH.x2, pointsH.y , pointsH.radius, 0, Math.PI*2, false) 
      context.fill();

      context.lineWidth = distansH.lineWidth;
      context.beginPath();
      context.moveTo(distansH.x0, distansH.y);
      context.lineTo(distansH.x1, distansH.y);
      context.stroke(); 
      
      context.beginPath();
      context.moveTo(dashesH.x10, dashesH.y0);
      context.lineTo(dashesH.x10, dashesH.y1);
      context.stroke();

      context.beginPath();
      context.moveTo(dashesH.x20, dashesH.y0);
      context.lineTo(dashesH.x20, dashesH.y1);
      context.stroke();

      context.restore();
    }  
    
    //запуск авто:
    const carState = document.querySelector("#question10_set div"); 
    let offDrive = document.getElementById("value10_off");
    let onDrive = document.getElementById("value10_on");
    carState.addEventListener("change", carDriveFunc); 

    function carDriveFunc () {   
      let carDrive  = document.forms.question10_set.elements.state_10quest.value;

        
      if (carDrive == "on") {
        playZvuk(zvuk2Cars)

        function drive () {     
          let pieceOfDistance = distansH.width / 900
          let speed1 = pieceOfDistance*car1H.speed   
          let speed2 = pieceOfDistance*car2H.speed 

          if (Math.round(car1H.x + car1H.width) != Math.round(car2H.x)) {
            car1H.x = car1H.x + speed1
            car2H.x = car2H.x - speed2
            drowAnim10();      
            timerAnim = requestAnimationFrame (drive); 
          }          
          else { //Если авто встретились:
            offDrive.click();
            onDrive.getAttribute("disabled", "")
            return;
          }      
        }
        drive ();
      }     
      else {        
        cancelAnimationFrame(timerAnim); 
        stopZvuk(zvuk2Cars)

        setTimeout ( function () {
          car1H.x = 0;
          car2H.x = cnvsH.width - car2H.width;                 
          drowAnim10();
          onDrive.removeAttribute("disabled")
        }, 1200)  
               
      }
    }

  }
  createAnim10 ();        


  function completeAnim(lastQuest) { 
    //выключаем невыключенные анимации, если пользователь сам этого не сделал:     
    if (lastQuest == 2){
      let offRotate = document.getElementById("value2_off");
      offRotate.click();      
    } 
    else if (lastQuest == 5){
      let offDrive = document.getElementById("value5_off");
      offDrive.click();      
    }  
    else if (lastQuest == 6){  
      let duck = document.getElementById("duck") 
      if (parseFloat(duck.getAttribute("y")) != duckStartY) {    //если утка сейчас всплывает  
        durkFinishFunc(); //таймер выключится сам, когда утка станет в стартовую позицию
        return;
      } 
    }  
    else if (lastQuest == 9){
      let offState = document.getElementById("value9_off");
      offState.click();      
    }   
    else if (lastQuest == 10){
      let offDrive = document.getElementById("value10_off");
      offDrive.click();      
    }  
    cancelAnimationFrame(timerAnim);  
  }

}  //createSlider() закрывающая скобка
  


//валидация ответов на вопрос:
const radioGroup1 = document.forms.question1.elements.pendulum;
const radioGroup2 = document.forms.question2.elements.circularMotion;
const radioGroup3 = document.forms.question3.elements.friction_force;
const radioGroup4 = document.forms.question4.elements.girl_moon;
const radioGroup5 = document.forms.question5.elements.one_car;
const radioGroup6 = document.forms.question6.elements.floating_body;
const radioGroup7 = document.forms.question7.elements.atom;
const radioGroup8 = document.forms.question8.elements.heat_liquid;
const radioGroup9 = document.forms.question9.elements.parallel_circuit;
const radioGroup10 = document.forms.question10.elements.two_cars;
let answers = [
  {number: 1, answer: 11, radioGroup: radioGroup1},
  {number: 2, answer: 22, radioGroup: radioGroup2},
  {number: 3, answer: 34, radioGroup: radioGroup3},
  {number: 4, answer: 43, radioGroup: radioGroup4},
  {number: 5, answer: 54, radioGroup: radioGroup5},
  {number: 6, answer: 62, radioGroup: radioGroup6},
  {number: 7, answer: 72, radioGroup: radioGroup7},
  {number: 8, answer: 82, radioGroup: radioGroup8},
  {number: 9, answer: 91, radioGroup: radioGroup9},
  {number: 10, answer: 103, radioGroup: radioGroup10}
]
function validFunc (numb) { 
  for (let i = 0; i < answers.length; i++) {
    let item = answers[i];
    if (item.number == numb) {
      const value = item.radioGroup.value;
      if (value == item.answer) {
        return true
      }
      return false;      
    }
  }
}


//настраиваем архитектуру кнопок "ответить" на вопрос и отображение результата ответа (через промисы и Promise.all):
function createButtonPromise(number) {
  // number - номер текущего вопроса, его же промис будет возвращать
  return new Promise( resolve => {        
    const buttonElem=document.getElementById(number+"button");
    buttonElem.addEventListener("click", ()=>{resolve(number)} );    
  });
}
let rightAnswers = 0; //кол-во правильных ответов
function setButtPromise () {
  let promiseStorage= []; //хранилище для созданных промисов
    
  for (let v = 1; v <= cntQuestions; v++) {     
    let promise = createButtonPromise (v)
    .then( result => {
      const buttonElem=document.getElementById(result+"button");
      const resultElem = buttonElem.parentNode;
      if (validFunc(result)) {     
        resultElem.innerHTML = "<p class='right_result'>Верно!</p>";
        rightAnswers++;
        playZvuk(zvukRightAnswer);
        document.querySelector("#results_bar_item" + result).classList.add("resultBar_right");          
      }
      else {        
        resultElem.innerHTML = "<p class='erorr_result'>Неверно!</p>";
        playZvuk(zvukMistakeAnswer);
        vibro(false);
        document.querySelector("#results_bar_item" + result).classList.add("resultBar_error");
      }  
      let allInputsInQuest = document.querySelectorAll("#question" + result + " " + ".question_body input");
      for (let i = 0; i < allInputsInQuest.length; i++) {          
        allInputsInQuest[i].setAttribute("disabled", ""); //чтобы пользователь после ответа на вопрос больше не "тыкал" на радио-кнопки
      } 
      let allLabelInQuest = document.querySelectorAll("#question" + result + " " + ".question_body label");
      for (let i = 0; i < allLabelInQuest.length; i++) {          
        allLabelInQuest[i].classList.add('disabled')
      }     
    }) 
    .catch( error => {
      console.log("Promise" + v + " отклонён с ошибкой: "+error);
    }); 
    promiseStorage.push(promise);
  };
  
  Promise.all( [...promiseStorage])
  .then( result => {
    setTimeout (finishTest, 3000)
    function finishTest () {        
      testStarted = false; 
      /////lockGetData ();//чтобы обновить инфо о результатах теста в таблицу результатов
      showFinallScore(userName, userLastName, rightAnswers);
    }      
  })
  .catch( error => {
    console.log("Promise.all отклонён с ошибкой: "+error);
  })  
};


const finallModalElem = document.querySelector("#modal_finall_result .modalRegistrdWindow");
function showFinallScore (n, l, s){
  const userInfo = document.getElementById("user_info");
  userInfo.innerHTML = n + " " + l + ", Ваша оценка";
  const finallScore = document.getElementById("finall_score");
  finallScore.innerHTML = s;
  const modalFinallResult = document.getElementById("modal_finall_result")
  changeContent(modalFinallResult);   
  animModalElem (finallModalElem, true) 
  playZvuk(zvukTestFinished);
  vibro(true);
}


const butFinRes = document.getElementById("but_finall_result");
butFinRes.onclick = function () {
  animModalElem (finallModalElem, false)
  const openModalElem = document.querySelector("#modal_finall_result .modalClosed");
  //чтобы CSS-анимация успела завершиться, ставим промис, который решается после окончания анимации и меняет вариабельный контент
  closeModalElem (openModalElem, creatContentFromURL, true)  
} 


//когда пользователь ответил на все вопросы, то сохраняем данные о нем и его результат на сервер:
let dataArrResults; // элемент массива - {name:'Петр', lastName:'Иванов', score: 6};
let updatePassword;
function lockGetData () {
  updatePassword=Math.random();
  $.ajax( {
      url : ajaxHandlerScript,
      type : 'POST', dataType:'json',
      data : { f : 'LOCKGET', n : stringAboutResult,
          p : updatePassword },
      cache : false,
      success : lockGetReady,
      error : errorHandler
    }
  );
}
function lockGetReady(callresult) {
  if ( callresult.error!=undefined )
    console.log(callresult.error);
  else {
    dataArrResults=[];
    if ( callresult.result!="" ) { // строка пустая - данных нет
      // либо в строке - JSON-представление массива данных
      dataArrResults=JSON.parse(callresult.result);
      console.log(dataArrResults);
      // вдруг кто-то сохранил мусор?
      if ( !Array.isArray(dataArrResults) ) {
        dataArrResults=[];
      }
    }
    
    dataArrResults.push( { name: userName, lastName: userLastName, score: rightAnswers} );
    dataArrResults.sort( (a, b) =>  b.score-a.score ); //сортируем по оценке (от большей к меньшей)
    console.log(dataArrResults)
    //Если надо обрезать сильно длинный массив результатов:
    //if ( dataArrResults.length > 15 ) {
    //dataArrResults=dataArrResults.slice(0, 15); //обрезать лишний кусок
    //*/  
    $.ajax( {
        url : ajaxHandlerScript,
        type : 'POST', dataType:'json',
        data : { f : 'UPDATE', n : stringAboutResult,
            v : JSON.stringify(dataArrResults), p : updatePassword },
        cache : false,
        success : updateReady,
        error : errorHandler
      }
    );
  }
};
// данные вместе с новым сохранены на сервере
function updateReady(callresult) {
  if ( callresult.error!=undefined ){
    console.log(callresult.error);
  }
};
function errorHandler(jqXHR,statusStr,errorStr) {
  console.log(statusStr+' '+errorStr);
}

































