async function fetchBestMovie() {
    try {
        const response = await fetch('http://localhost:8000/api/v1/titles/?sort_by=-imdb_score');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des données');
        }
        const data = await response.json();
        const bestMovie = data.results[0];

        const detailsResponse = await fetch(`http://localhost:8000/api/v1/titles/${bestMovie.id}`);
        if (!detailsResponse.ok) {
            throw new Error('Erreur lors de la récupération des détails du film');
        }
        const details = await detailsResponse.json();

        document.getElementById('best-movie-title').textContent = details.title;
        document.getElementById('best-movie-image').src = details.image_url;
        document.getElementById('best-movie-description').textContent = details.description;

        const detailsButton = document.getElementById('best-movie-details-button');

        // Nettoyer les anciens événements en clonant le bouton
        const newDetailsButton = detailsButton.cloneNode(true);
        detailsButton.parentNode.replaceChild(newDetailsButton, detailsButton);

        // Ajouter un nouvel événement
        newDetailsButton.setAttribute('data-movie-id', bestMovie.id);
        newDetailsButton.addEventListener('click', () => {
            showMovieModal(bestMovie.id);
        });
    } catch (error) {
        console.error('Erreur:', error);
    }
}

async function fetchMovieDetails(movieId) {
    try {
        const response = await fetch(`http://localhost:8000/api/v1/titles/${movieId}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des détails du film');
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Impossible de récupérer les détails du film.');
    }
}

async function showMovieModal(movieId) {
    const movie = await fetchMovieDetails(movieId);

    if (movie) {
        const modalContent = document.getElementById('modal-content');
        modalContent.innerHTML = `
        <div class="flex flex-col lg:flex-row ef-font-oswald font-bold">
            <!-- Partie gauche (informations) -->
            <div class="flex-1 order-2 lg:order-1">
                <h2 class="text-3xl">${movie.title}</h2>
                <p>${new Date(movie.date_published).getFullYear()} - ${movie.genres.join(', ')}</p>
                <p>${movie.duration} minutes (${movie.countries.join(', ')})</p>
                <p>IMDB score : ${movie.imdb_score}/10</p>
                <p>Recettes au box-office : ${movie.worldwide_gross_income || 'N/C'}</p>
                <p class="font-semibold">Réalisé par :</p>
                <p class="font-thin">${movie.directors.join(', ')}</p>
            </div>
            <!-- Partie droite (image, visible uniquement en lg) -->
            <div class="flex-1 flex justify-start items-center mt-4 lg:mt-0 order-3 lg:order-2">
                <img src="${movie.image_url}" alt="${movie.title}" class="w-64 h-auto">
            </div>
        </div>
        <!-- Ligne suivante : description -->
        <div class="mt-4 order-1 lg:order-3">
            <p class="font-thin ef-font-oswald">${movie.long_description || 'Résumé non disponible.'}</p>
        </div>
        <!-- Ligne suivante : acteurs -->
        <div class="mt-4 order-4 ef-font-oswald">
            <p class="font-semibold">Avec :</p>
            <p class="font-thin">${movie.actors.join(', ')}</p>
        </div>
        <!-- Croix pour fermer (visible uniquement en mobile et tablette) -->
        <button id="close-modal-cross" class="absolute top-2 right-2 text-red-600 hover:text-red-800 text-3xl font-bold block lg:hidden cursor-pointer">
            &#10005;
        </button>
        <!-- Ligne suivante : bouton Fermer (visible uniquement en lg) -->
        <div class="mt-6 flex justify-center order-5 hidden lg:flex">
            <button id="close-modal-button" class="px-6 py-2 bg-red-600 text-white text-lg font-semibold rounded-3xl hover:bg-red-800 cursor-pointer">
                Fermer
            </button>
        </div>
    `;

        const modal = document.getElementById('movie-modal');
        modal.classList.remove('hidden');


        const closeModalCross = document.getElementById('close-modal-cross');
        if (closeModalCross) {
            closeModalCross.addEventListener('click', closeMovieModal);
        }

        const closeModalButton = document.getElementById('close-modal-button');
        if (closeModalButton) {
            closeModalButton.addEventListener('click', closeMovieModal);
        }
    }
}

async function fetchMoviesByGenre(genre, listId, seeMoreId, seeLessId) {
    try {
        const response = await fetch(`http://localhost:8000/api/v1/titles/?sort_by=-imdb_score&page_size=6&genre=${genre}`);
        if (!response.ok) {
            throw new Error(`Erreur lors de la récupération des films pour le genre : ${genre}`);
        }
        const data = await response.json();
        const movies = data.results;

        const moviesList = document.getElementById(listId);
        const seeMoreButton = document.getElementById(seeMoreId);
        const seeLessButton = document.getElementById(seeLessId);

        let visibleMovies = 0;
        let initialVisibleMovies = 0;

        const displayMovies = (count) => {
            moviesList.innerHTML = '';
            moviesList.classList.add('grid', 'gap-10');

            movies.slice(0, count).forEach((movie) => {
                const movieCard = document.createElement('div');
                movieCard.classList.add('relative', 'overflow-hidden');

                movieCard.innerHTML = `
                    <div>
                        <img src="${movie.image_url}" 
                            class="w-full h-auto max-h-[241px] md:max-h-[300px] object-cover" 
                            alt="Affiche de ${movie.title}">
                        <div class="absolute top-8 left-0 w-full text-white flex flex-col justify-between p-4"
                            style="background-color: rgba(31, 41, 55, 0.5);">
                            <h5 class="text-2xl font-semibold self-start">${movie.title}</h5>
                            <button 
                                class="mt-2 px-4 py-1 bg-gray-800 text-white text-sm font-semibold rounded-3xl self-end hover:bg-gray-600 hover:underline cursor-pointer"
                                data-movie-id="${movie.id}">
                                Détails
                            </button>
                        </div>
                    </div>
                `;
                moviesList.appendChild(movieCard);
            });

            addDetailsButtonListeners();
        };

        const updateMoviesDisplay = () => {
            const screenWidth = window.innerWidth;

            if (screenWidth < 768) {
                visibleMovies = 2;
            } else if (screenWidth < 1024) {
                visibleMovies = 4;
            } else {
                visibleMovies = 6;
            }

            initialVisibleMovies = visibleMovies;
            displayMovies(visibleMovies);

            if (visibleMovies < movies.length) {
                seeMoreButton.classList.remove('hidden');
                seeLessButton.classList.add('hidden');
            } else {
                seeMoreButton.classList.add('hidden');
                seeLessButton.classList.add('hidden');
            }
        };

        seeMoreButton.addEventListener('click', () => {
            visibleMovies = movies.length;
            displayMovies(visibleMovies);
            seeMoreButton.classList.add('hidden');
            seeLessButton.classList.remove('hidden');
        });

        seeLessButton.addEventListener('click', () => {
            visibleMovies = initialVisibleMovies;
            displayMovies(visibleMovies);
            seeMoreButton.classList.remove('hidden');
            seeLessButton.classList.add('hidden');
        });

        updateMoviesDisplay();
        window.addEventListener('resize', updateMoviesDisplay);
    } catch (error) {
        console.error('Erreur:', error);
    }
}

async function fetchMoviesByCategory(category) {
    try {
        const categoryMoviesList = document.getElementById('category-movies-list');

        if (!category) {
            console.warn('Aucune catégorie sélectionnée.');
            categoryMoviesList.innerHTML = '';
            return;
        }

        const response = await fetch(`http://localhost:8000/api/v1/titles/?sort_by=-imdb_score&page_size=6&genre=${category}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des films pour la catégorie : ' + category);
        }

        const data = await response.json();
        const movies = data.results;

        categoryMoviesList.innerHTML = '';
        categoryMoviesList.classList.add('grid', 'gap-10');

        movies.forEach((movie) => {
            const movieCard = document.createElement('div');
            movieCard.classList.add('relative', 'overflow-hidden');

            movieCard.innerHTML = `
                <div>
                    <img src="${movie.image_url}" 
                        class="w-full h-auto max-h-[241px] md:max-h-[300px] object-cover" 
                        alt="Affiche de ${movie.title}">
                    <div class="absolute top-8 left-0 w-full text-white flex flex-col justify-between p-4"
                        style="background-color: rgba(31, 41, 55, 0.5);">
                        <h5 class="text-2xl font-semibold self-start">${movie.title}</h5>
                        <button 
                            class="mt-2 px-4 py-1 bg-gray-800 text-white text-sm font-semibold rounded-3xl self-end hover:bg-gray-600 hover:underline cursor-pointer"
                            data-movie-id="${movie.id}">
                            Détails
                        </button>
                    </div>
                </div>
            `;
            categoryMoviesList.appendChild(movieCard);
        });

        addDetailsButtonListeners();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue lors de la récupération des films.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchBestMovie();
    fetchMoviesByGenre('', 'top-movies-list', 'see-more-button', 'see-less-button');
    fetchMoviesByGenre('Mystery', 'top-mystery-movies-list', 'see-more-button-mystery', 'see-less-button-mystery');
    fetchMoviesByGenre('Crime', 'top-crime-movies-list', 'see-more-button-crime', 'see-less-button-crime');

    const categorySelect = document.getElementById('category-select');
    if (categorySelect) {
        categorySelect.addEventListener('change', (event) => {
            const selectedCategory = event.target.value;
            fetchMoviesByCategory(selectedCategory);
        });
    }

    const closeModalButton = document.getElementById('close-modal');
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeMovieModal);
    }
});

function addDetailsButtonListeners() {
    document.querySelectorAll('[data-movie-id]').forEach(button => {
        button.addEventListener('click', (event) => {
            const movieId = event.target.getAttribute('data-movie-id');
            showMovieModal(movieId);
        });
    });
}

function closeMovieModal() {
    const modal = document.getElementById('movie-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}