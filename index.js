const key = 'a8d79be8';
const form = document.getElementById('search-form');
const watchlist = document.getElementById('watchlist');
let moviesId = [];
let results = [];

form?.addEventListener('submit', async(e) => {
    e.preventDefault();
    results = [];
    const formData = new FormData(form);
    const title = (formData.get('title')).trim();
    await getMoviesID(title);
    
   if(moviesId.length) {
        const movieResults = await getMoviesInfos(moviesId);
        displayResults(movieResults);
    }
});

async function getMoviesID(searchQuery) {
    await fetch(`https://www.omdbapi.com/?apikey=${key}&s=${searchQuery}`).then(res => res.json()).then(data => {
        if (data.Response === 'True') {
            const basicResult = data.Search;
            moviesId = basicResult.flat().map((movie) => {
                return movie.imdbID;
            });
            return moviesId;
        } else {
            document.getElementById('default-content').innerHTML = `
                <p class="default-text">
                    Unable to find what you're looking for. Please try another search.
                </p>
            `;
            return [];
        }
    });
}

async function getMoviesInfos(ids) {
    const promises = ids.map(async (id) => {
        const res = await fetch(`https://www.omdbapi.com/?apikey=${key}&i=${id}`);
        return res.json();
    });
    
    results = await Promise.all(promises);
    return results;
}

function isInWatchlist(movieId) {
    return Object.values(localStorage).includes(movieId);
}

function getMovieKey(movieId) {
    for (let key in localStorage) {
        if (localStorage[key] === movieId && key.startsWith('Movie')) {
            return key;
        }
    }
    return null;
}

function displayResults(movies) {    
    let html = movies.map((movie) => {
        const inWatchlist = isInWatchlist(movie.imdbID);
        const buttonClass = inWatchlist ? 'remove-btn' : 'add-btn';
        const buttonText = inWatchlist ? 'Remove' : 'Add movie';
        const iconClass = inWatchlist ? 'fa-circle-minus' : 'fa-circle-plus';
        return `
        <li class="movie-item">
            <img class="poster" src="${movie.Poster}">
            <div class="movie-infos">
                <div class="sub-infos">
                    <h5 id="movie-title">${movie.Title}</h5>
                    <p class="rating">⭐️ ${movie.imdbRating}</p>
                </div>
                <div class="sub-infos">
                    <p class="runtime">${movie.Runtime}</p>
                    <p class="genre">${movie.Genre}</p>
                    <button class="${buttonClass}" data-movie-id="${movie.imdbID}">
                        <i class="fa-solid ${iconClass}"></i> ${buttonText}
                    </button>
                </div>
                <p class="summary">${movie.Plot}</p>
            </div>
        </li>
        `
    });
    document.getElementById('default-content').style.display = 'none';
    document.getElementById('movies-list').innerHTML = html.join('');
}

document.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-movie-id]');
    if (!button) return;
    
    const movieId = button.dataset.movieId;
    
    if (button.classList.contains('add-btn')) {
        addMovieToList(movieId, button);
    } else if (button.classList.contains('remove-btn')) {
        removeMovieFromList(movieId, button);
    }
})

function addMovieToList(id, buttonEl) {
    localStorage.setItem(`Movie ${Date.now()}`, id);
    updateButton(buttonEl, true);
}

function removeMovieFromList(id, buttonEl) {
    const key = getMovieKey(id);
    if (key) {
        localStorage.removeItem(key);
    }
    
    updateButton(buttonEl, false);
}

function updateButton(button, isInWatchlist) {
    const icon = button.querySelector('i');
    
    if (isInWatchlist) {
        button.classList.remove('add-btn');
        button.classList.add('remove-btn');
        icon.classList.remove('fa-circle-plus');
        icon.classList.add('fa-circle-minus');
        button.childNodes[2].textContent = ' Remove';
    } else {
        button.classList.remove('remove-btn');
        button.classList.add('add-btn');
        icon.classList.remove('fa-circle-minus');
        icon.classList.add('fa-circle-plus');
        button.childNodes[2].textContent = ' Add movie';
    }
}

async function getWatchlist() {
    let watchlist = [];
    Object.keys(localStorage).forEach(function(key){
        if (key.startsWith('Movie')) {
            watchlist.push(localStorage.getItem(key));
        }
    });
    
    if(watchlist.length) {
        const movieResults = await getMoviesInfos(watchlist);
        displayResults(movieResults);
    }
}

if(watchlist) {
    getWatchlist();
}