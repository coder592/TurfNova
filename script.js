import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import { db } from "./firebase-config.js";


const turfList =
    document.getElementById("turfList");


async function loadTurf() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "turfs")
            );


        turfList.innerHTML = "";

        let foundTurf = false;


        snapshot.forEach((doc) => {

            const turf = doc.data();


            if (turf.active !== true) {
                return;
            }


            foundTurf = true;


            const card =
                document.createElement("article");

            card.className = "turf-card";


            const imageHTML = turf.image
                ? `
                    <img
                        src="${turf.image}"
                        alt="TurfNova Arena"
                    >
                  `
                : `
                    <div class="turf-placeholder">
                        <span>TN</span>
                    </div>
                  `;


            card.innerHTML = `

                <div class="turf-image">
                    ${imageHTML}
                </div>


                <div class="turf-info">

                    <span class="turf-kicker">
                        YOUR PLAYING SPACE
                    </span>


                    <h3 class="turf-name">
                        ${turf.name || "TurfNova Arena"}
                    </h3>


                    <div class="turf-accent-line"></div>


                    <div class="turf-details">

                        <div>
                            <span>Hourly Rate</span>

                            <strong>
                                ₹${turf.price || 0} / hour
                            </strong>
                        </div>


                        <div>
                            <span>Operating Hours</span>

                            <strong>
                                ${turf.openingTime || "--"}
                                –
                                ${turf.closingTime || "--"}
                            </strong>
                        </div>

                    </div>


                    <a
                        href="booking.html?turf=${doc.id}"
                        class="primary-btn"
                    >
                        Check Availability
                        <span>→</span>
                    </a>

                </div>

            `;


            turfList.appendChild(card);

        });


        if (!foundTurf) {

            turfList.innerHTML = `
                <div class="no-turf">
                    Turf availability is currently unavailable.
                </div>
            `;

        }


    } catch (error) {

        console.error(error);

        turfList.innerHTML = `
            <div class="no-turf error-text">
                Unable to load turf information.
            </div>
        `;
    }
}


loadTurf();