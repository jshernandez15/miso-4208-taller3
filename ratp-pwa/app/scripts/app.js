(function () {
    'use strict';

    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange

    if (!window.indexedDB) {
        window.alert("Your browser doesn't support a stable version of IndexedDB.")
    }

    var app = {
        isLoading: true,
        visibleCards: {},
        selectedTimetables: [],
        spinner: document.querySelector('.loader'),
        cardTemplate: document.querySelector('.cardTemplate'),
        container: document.querySelector('.main'),
        addDialog: document.querySelector('.dialog-container')
    };


    /*****************************************************************************
     *
     * Event listeners for UI elements
     *
     ****************************************************************************/

    document.getElementById('butRefresh').addEventListener('click', function () {
        // Refresh all of the forecasts
        app.updateSchedules();
    });

    document.getElementById('butAdd').addEventListener('click', function () {
        app.toggleAddDialog(true);
    });

    document.getElementById('butAddCity').addEventListener('click', function () {


        var select = document.getElementById('selectTimetableToAdd');
        var selected = select.options[select.selectedIndex];
        var key = selected.value;
        var label = selected.textContent;
        if (!app.selectedTimetables) {
            app.selectedTimetables = [];
        }
        app.getSchedule(key, label);
        app.selectedTimetables.push({key: key, label: label});
        app.saveSelectedTimetables();
        app.toggleAddDialog(false);
    });

    document.getElementById('butAddCancel').addEventListener('click', function () {
        // Close the add new city dialog
        app.toggleAddDialog(false);
    });


    /*****************************************************************************
     *
     * Methods to update/refresh the UI
     *
     ****************************************************************************/

    // Toggles the visibility of the add new city dialog.
    app.toggleAddDialog = function (visible) {
        if (visible) {
            app.addDialog.classList.add('dialog-container--visible');
        } else {
            app.addDialog.classList.remove('dialog-container--visible');
        }
    };

    // Updates a weather card with the latest weather forecast. If the card
    // doesn't already exist, it's cloned from the template.

    app.updateTimetableCard = function (data) {
        var key = data.key;
        var dataLastUpdated = new Date(data.created);
        var schedules = data.schedules;
        var card = app.visibleCards[key];

        if (!card) {
            var label = data.label.split(', ');
            var title = label[0];
            var subtitle = label[1];
            card = app.cardTemplate.cloneNode(true);
            card.classList.remove('cardTemplate');
            card.querySelector('.label').textContent = title;
            card.querySelector('.subtitle').textContent = subtitle;
            card.removeAttribute('hidden');
            app.container.appendChild(card);
            app.visibleCards[key] = card;
        }
        card.querySelector('.card-last-updated').textContent = data.created;

        var scheduleUIs = card.querySelectorAll('.schedule');
        for(var i = 0; i<4; i++) {
            var schedule = schedules[i];
            var scheduleUI = scheduleUIs[i];
            if(schedule && scheduleUI) {
                scheduleUI.querySelector('.message').textContent = schedule.message;
            }
        }

        if (app.isLoading) {
            window.cardLoadTime = performance.now();
            app.spinner.setAttribute('hidden', true);
            app.container.removeAttribute('hidden');
            app.isLoading = false;
        }
    };

    app.saveSelectedTimetables = function() {

        for (var i in app.selectedTimetables) {

            var request = db.transaction(["timetables"], "readwrite")
                .objectStore("timetables")
                .add(app.selectedTimetables[i]);

            request.onsuccess = function(event) {
              console.log("time table " + i + " stored on IndexedDB.");
            };

            request.onerror = function(event) {
              console.log("Unable to store time table " + i + " on IndexedDB, it's already on the database");
            }

        }

    };

    app.readSelectedTimeTables = function(callback) {
        app.selectedTimetables = [];
        try{
            var objectStore = db.transaction("timetables").objectStore("timetables");
            objectStore.openCursor().onsuccess = function(event) {
                var cursor = event.target.result;

                if (cursor) {
                    app.selectedTimetables.push(cursor.value);
                    cursor.continue();
                }
                else {
                    console.log("No more entries reading from IndexedDB!");
                    callback();
                }
            };
        }
        catch(e){
            console.log("First load, there's no data to read");
        }
    }

    /*****************************************************************************
     *
     * Methods for dealing with the model
     *
     ****************************************************************************/


    app.getSchedule = function (key, label) {
        var url = 'https://api-ratp.pierre-grimaud.fr/v3/schedules/' + key;

        if ('caches' in window) {
          caches.match(url).then(function(response) {
            if (response) {
              response.json().then(function updateFromCache(json) {
                var result = {};
                result.key = key;
                result.label = label;
                result.created = json._metadata.date;
                result.schedules = json.result.schedules;
                app.updateTimetableCard(result);
              });
            }
          });
        }

        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    window.firstRequest = performance.now();
                    var response = JSON.parse(request.response);
                    var result = {};
                    result.key = key;
                    result.label = label;
                    result.created = response._metadata.date;
                    result.schedules = response.result.schedules;
                    app.updateTimetableCard(result);
                }
            } else {
                // Return the initial weather forecast since no data is available.
                app.updateTimetableCard(initialStationTimetable);
            }
        };
        request.open('GET', url);
        request.send();
    };

    // Iterate all of the cards and attempt to get the latest forecast data
    app.updateSchedules = function () {
        var keys = Object.keys(app.visibleCards);
        keys.forEach(function (key) {
            app.getSchedule(key);
        });
    };

    /*
     * Fake weather data that is presented when the user first uses the app,
     * or when the user has not saved any cities. See startup code for more
     * discussion.
     */

    var initialStationTimetable = {

        key: 'metros/1/bastille/A',
        label: 'Bastille, Direction La Défense',
        created: '2017-07-18T17:08:42+02:00',
        schedules: [
            {
                message: '0 mn'
            },
            {
                message: '2 mn'
            },
            {
                message: '5 mn'
            }
        ]


    };


    app.getSchedule('metros/1/bastille/A', 'Bastille, Direction La Défense');
    app.selectedTimetables = [
        {key: initialStationTimetable.key, label: initialStationTimetable.label}
    ];

    var db;
    var request = window.indexedDB.open("timetables", 1);

    request.onerror = function(event) {
        console.log("error: ");
    };

    request.onsuccess = function(event) {
        db = request.result;
        console.log("success: "+ db);
        app.readSelectedTimeTables(function(){
            if (app.selectedTimetables) {
                app.selectedTimetables.forEach(function(timeTable) {
                    app.getSchedule(timeTable.key, timeTable.label);
                });
            } else {
                app.updateTimetableCard(initialStationTimetable);
                app.selectedTimetables = [
                {key: initialStationTimetable.key, label: initialStationTimetable.label}
                ];
                app.saveSelectedTimetables();
            }
        });
    };

    request.onupgradeneeded = function(event) {
        console.log("IndexedDB: creating object store");
        var db = event.target.result;
        var objectStore = db.createObjectStore("timetables", {keyPath: "key"});

        for (var i in app.selectedTimetables) {
            objectStore.add(app.selectedTimetables[i]);
        }
        console.log("IndexedDB: object store created");
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('./service-worker.js')
            .then(function() {
                console.log('Service Worker Registered'); 
            });
    }
})();
