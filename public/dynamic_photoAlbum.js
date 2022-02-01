require('dotenv').config();
// ------------------------ METHODS ------------------------
// Gets the photos from API in Json format
// Returns false if it fails to fetch
const get_data = async url => {
    var response = false;
    try {
        response = await fetch(url, {
            headers: {
                Authorization: process.env.API_KEY
            }
        });
    } catch (err) { // If there was some server error
        return "error";
    }
    var treatedResponse = await response.json();
    const resultsCount = treatedResponse.page * treatedResponse.per_page;
    if (treatedResponse.total_results === 0 || resultsCount > treatedResponse.total_results) // If there are no results
        return false;
    return treatedResponse;
};


// Stores each image object in global data(AllImages)
// OBS: Each image object contains several photos,
//  the author's name, average color etc.
const save_new_images = (AllImages, newPhotos) => {
    newPhotos.forEach(photo => {
        AllImages.push(photo);
    });
    return AllImages;
};


// Returns a string with the key of the ideal 
// image format to be picked for fullscreen
// mode according to screen size
const biggest_image = () => {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    if (viewportHeight > viewportWidth)
        return "portrait";
    if (viewportWidth >= 1100)
        return "landscape";
    else if (viewportWidth >= 500)
        return "large2x";
    else
        return "medium";
}


// Assigns data from imgsToInjectArray into HTML format tags
// Returns variable with all tags
const assign_data_to_html = imgsToInjectArray => {
    var imgDiv = ``;
    const imagesHeight = divHeight();
    var fullscreenImgString = biggest_image();
    imgsToInjectArray.forEach(img => {
        imgDiv += `
            <div 
                class="image" 
                style="height:${imagesHeight}px;"
                data-bigimage="${img.src[fullscreenImgString]}"
                data-photographer="${img.photographer_url}"
                data-photoname="${img.alt}"
                data-portraitimg="${img.src.portrait}" 
            >
                <img class="visible-img toObserve" src="" data-src="${img.src.portrait}" alt="${img.alt}">
                <p class="photo-name">${img.alt}</p>
                <a href=${img.photographer_url} class="photographer-info" rel="noopener" target="_blank">
                    <img src="./images/Pexels_logo.png" alt="Pexels logo" class="photographer-img">
                    <h3 class="photographer-name">${img.photographer}</h3>
                </a>  
            </div>  
        `;
    });
    return imgDiv;
}; 


// Injects the images from imgsToInject into the main imgContainer
// The imgsToInject variable must contain all tags already
// embeded with the data
const inject_HTML = (imgContainer, imgsToInject) => {
    imgContainer.insertAdjacentHTML("beforeend", imgsToInject);
}; 


// Returns the adequated height that the image div
// should have(height = width) based on CSS 
// specs. This avoids the need for placeholder
// div from which we'd have to get the width.
const divHeight = () => {
    var divWidth = 0;
    const imagesContainer = document.getElementById("images-container");
    if (window.innerWidth > 600)
        divWidth = 0.322 * imagesContainer.clientWidth;
    else if (window.innerWidth > 400)
        divWidth = 0.485 * imagesContainer.clientWidth;
    else
        divWidth = 0.96 * imagesContainer.clientWidth;
    return divWidth; 
}


// Gets the fullscreen image src and assigns it to 
// the image tag in the fullscreen container 
const fullscreen = imgContainer => {
    const fullscreen = document.getElementsByClassName("fullscreen")[0];
    fullscreen.style.display = `block`;
    fullscreen.style.width = `100vw`;
    fullscreen.style.height = `100vh`;
    fs_image(imgContainer);
}


// Assigns the adequate image to fullscreen mode
// If it's a landscape screen, calculates the image
// proportions to create the desired layout,
// aligning the image with the exit button.
const fs_image = imgInfo => {
    const fsImage = document.getElementsByClassName("fullscreen__picture")[0];
    fsImage.alt = `${imgInfo.dataset.photoname}`
    if (window.innerHeight > window.innerWidth) { // If it's a portrait screen
        fsImage.src = `${imgInfo.dataset.portraitimg}`;
        fsImage.style.width = `100%`;
        fsImage.style.height = `100%`;
        return;
    }
    fsImage.src = `${imgInfo.dataset.bigimage}`;
    const exitBtn = document.getElementsByClassName("fullscreen__exit")[0];
    const btnPos = exitBtn.getBoundingClientRect();
    const btnRightPos = window.innerWidth - btnPos.right;
    const btnTopPos = btnPos.top;
    var relativeWidth = (exitBtn.clientWidth + btnRightPos) / window.innerWidth;
    var relativeHeight = (exitBtn.clientHeight + btnTopPos) / window.innerHeight;
    relativeWidth *= 200;
    relativeHeight *= 200;
    fsImage.style.width = `${100 - relativeWidth}%`;
    fsImage.style.height = `${100 - relativeHeight}%`;
}


// Gets user out from fullscreen mode
const exit_fullscreen = () => {
    const fullscreen = document.getElementsByClassName("fullscreen");
    const fsImage = document.getElementsByClassName("fullscreen__picture")[0];
    fsImage.src = ``;
    fullscreen[0].style.width = `0vw`;
    fullscreen[0].style.height = `0vh`;
    
    setTimeout(() => {
        fullscreen[0].style.display = `none`;
    }, 200);
}


// if msgToPrint is "hideLoading" it changes the display
// of loading icon to none
// else if msgToPrint is "showLoading" it changes the display
// of loading icon to inline-block
// Else, it hides the loading icon and prints exception 
// cases messages into the h3 indicators tag
const printMessage =  msgToPrint => {
    const indicators = document.getElementsByClassName("indicators");
    switch (msgToPrint) {
        case "hideLoading":
            indicators[1].style.display = `none`;
            indicators[2].style.display = `none`;
            break;

        case "showLoading":
            indicators[1].style.display = `inline-block`;
            indicators[2].style.display = `none`;
            break;
    
        default:
            indicators[1].style.display = `none`;
            indicators[2].style.display = `inline-block`;
            indicators[2].innerHTML = msgToPrint;
            break;
    }
}


// Deletes images from the main container 
const resetImgs = () => {
    const imagesMainContainer = document.getElementById("images-container");
    const imgsToObserve = document.getElementsByClassName("visible-img toObserve");
    Array.prototype.slice // Unobserves images that are about to be erased
        .call(imgsToObserve)
        .forEach(elem => {
            imageObserver.unobserve(elem);
        });
    imagesMainContainer.innerHTML = ``; //Erases current divs since it was a personalized new search
}


// Implementing Intersection Observer
var observerOptions = {
    root: null, // Page as root
    rootMargin: '0px',
    threshold: 0
};
const imageObserver = new IntersectionObserver((entries, imgObserver) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && (entry.target.className === "indicators indicators__container toObserve")) {
            // Logic for when loading/message container appears
            // // If thereis a message being displayed the loading function should not be called
            // If there is an error message being displayed the loading function should not be called
            if (page.errorMsg) {
                return;
            }
            loadImages(page);
        } else if (entry.isIntersecting && (entry.target.className === "visible-img toObserve")) {
            // Logic for unloaded images appearing on page 
            const lazyImage = entry.target
            lazyImage.src = lazyImage.dataset.src
            lazyImage.classList.remove("toObserve");
            imgObserver.unobserve(lazyImage);
        } else {
            // Logic for entries that are not intersecting and for entries that got out of view(in this
            // case only the loading container remains observed after being observed once.
        }
    });
}, observerOptions);


// Loads the new images and adjusts information
// being displayed as loading icon or message
const loadImages = async page => {
    printMessage("showLoading");
    var url = `https://api.pexels.com/v1/search/?page=${page.index}&per_page=${2 * page.imgPerPage}&query=${page.theme}`;
    const imagesContainer = document.getElementById("images-container");
    const data = await get_data(url);
    if (!data && page.index > 1) {
        page.errorMsg = true;
        printMessage("No more results.");
        return;
    } else if (data === "error") {
        page.errorMsg = true;
        printMessage("Server error :( <br> Try later");
        return;
    } else if (!data) {
        const message = `No results for "${page.theme}".`;
        printMessage(message);
        page.errorMsg = true;
        return;
    } else {
        const newHTML = assign_data_to_html(data.photos);
        save_new_images(page.allImages, data.photos);
        inject_HTML(imagesContainer, newHTML);
        printMessage("hideLoading");
        page.errorMsg = false;
        Array.prototype.slice
            .call(document.getElementsByClassName("toObserve"))
            .forEach(elem => {
                imageObserver.observe(elem);
            });
        page.index++;
    }
}


// ------------------------ FIRST CODE RUN ------------------------
const imagesContainer = document.getElementById("images-container");
var placeholders = document.getElementsByClassName("placeholder");
var images = document.getElementsByClassName("image");
var viewportHeight = window.innerHeight;
var imagesWidth = divHeight();;
var imgContWidth = imagesContainer.clientWidth;
var page = {
    index: 1,
    imgPerPage: 9,
    allImages: [],
    errorMsg: true,
    theme: "nature"
};

// Discovering how many images fit in one viewport
// considering the expected design layout
// It rounds up the total number
// Discovering how many images fit in width
page.imgPerPage = Math.floor(imgContWidth / imagesWidth);
// Multiplying by the amount of images that
// fit the viewport height
page.imgPerPage *= Math.ceil(viewportHeight / imagesWidth);

//Transforming images node list into array
images = Array.prototype.slice.call(images);

// Setting images Height for the first time
images.forEach(image => image.style.height = `${imagesWidth}px`);

// Calling Intersection Observer
Array.prototype.slice.call(document.getElementsByClassName("toObserve")).forEach(elem => {
    imageObserver.observe(elem);
});

// First image request
loadImages(page);


// <<<<<<<<<<<<<<< EVENT LISTENERS >>>>>>>>>>>>>>>>
// Readjust variables and styles when the page os resized
window.addEventListener("resize", (e) => {
    e.preventDefault();
    // Recalculating variables values
    images = document.getElementsByClassName("image");
    images = Array.prototype.slice.call(images);
    viewportHeight = window.innerHeight;
    imgContWidth = imagesContainer.clientWidth;

    // Setting images Height equal to Width
    images.forEach(image => image.style.height = `${divHeight()}px`);

    // Recalculating how many images fit the viewport
    // considering the expected layout design
    page.imgPerPage = Math.floor(imgContWidth / divHeight());
    page.imgPerPage *= Math.ceil(viewportHeight / divHeight());

    // Exits fullscreen if it was open
    const fullscreen = document.getElementsByClassName("fullscreen")[0];
    if (fullscreen.style.display === "block") {
        exit_fullscreen();
    }
});

document.getElementsByTagName("html")[0].addEventListener("click", e => {
    const searchInput = document.getElementById("search-input");
    if (e.target.className === "menu__name") {
        page.index = 1; // Reinitialize page count
        page.theme = "nature";
        page.errorMsg = true;
        resetImgs();
        loadImages(page);
    } else if (e.target.className === "search-bar__search") {
        if (searchInput.value === "")
            return;
        page.index = 1; // Reinitialize page count
        page.theme = searchInput.value;
        page.errorMsg = true;
        resetImgs();
        loadImages(page);
    } else if (e.target.className === "search-bar__clear") {
        searchInput.value = "";
        searchInput.focus();
    } else if (e.target.className === "visible-img") {
        fullscreen(e.target.parentElement);
    } else if (e.target.className === "fullscreen" || e.target.tagName === "svg" || e.target.tagName === "path") {
        exit_fullscreen();
    }
});


document.getElementsByClassName("search-bar__input")[0].addEventListener("keyup", e => {
    const searchInput = document.getElementById("search-input");
    if (e.keyCode === 13 && searchInput.value === "") // If nothing was searched but enter was pressed, do nothing.
        return;
    else if (e.keyCode === 13) { // If "Enter" was pressed
        e.preventDefault();
        page.index = 1; // Reinitialize page count
        page.theme = searchInput.value;
        page.errorMsg = true;
        resetImgs();
        loadImages(page);
    }
  }); 

// Create navigation bar functionalities