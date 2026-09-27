import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import { db } from "./firebase-config.js";


/* =====================================================
   ELEMENTS
===================================================== */

const params =
    new URLSearchParams(window.location.search);

const turfId =
    params.get("turf");

const bookingTurfInfo =
    document.getElementById("bookingTurfInfo");

const bookingDate =
    document.getElementById("bookingDate");

const slotList =
    document.getElementById("slotList");

const customerName =
    document.getElementById("customerName");

const customerPhone =
    document.getElementById("customerPhone");

const confirmBookingBtn =
    document.getElementById("confirmBookingBtn");

const bookingMessage =
    document.getElementById("bookingMessage");

const cancelBookingBtn =
    document.getElementById("cancelBookingBtn");

const cancelPhone =
    document.getElementById("cancelPhone");

const cancelMessage =
    document.getElementById("cancelMessage");


/* =====================================================
   STATE
===================================================== */

let turfData = null;

let selectedSlot = null;

let selectedBookedSlot = null;


/* =====================================================
   DATE HELPERS
===================================================== */

function getTodayString() {

    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(today.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(today.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


if (bookingDate) {

    bookingDate.min =
        getTodayString();

    bookingDate.value =
        getTodayString();
}


/* =====================================================
   TIME HELPERS
===================================================== */

function timeToMinutes(time) {

    const parts =
        String(time)
            .split(":")
            .map(Number);

    return (
        (parts[0] * 60) +
        (parts[1] || 0)
    );
}


function formatTime(totalMinutes) {

    const hours =
        Math.floor(totalMinutes / 60);

    const minutes =
        totalMinutes % 60;

    const period =
        hours >= 12
            ? "PM"
            : "AM";

    let displayHour =
        hours % 12;

    if (displayHour === 0) {
        displayHour = 12;
    }

    return (
        `${String(displayHour).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")} ${period}`
    );
}


function extractStartTime(slot) {

    if (!slot) {
        return null;
    }

    const match =
        slot.match(
            /(\d{1,2}):(\d{2})\s*(AM|PM)/i
        );

    if (!match) {
        return null;
    }

    let hour =
        parseInt(match[1], 10);

    const minute =
        match[2];

    const period =
        match[3].toLowerCase();

    if (
        period === "pm" &&
        hour !== 12
    ) {
        hour += 12;
    }

    if (
        period === "am" &&
        hour === 12
    ) {
        hour = 0;
    }

    return (
        String(hour).padStart(2, "0") +
        ":" +
        minute
    );
}


/* =====================================================
   LOAD TURF
===================================================== */

async function loadTurf() {

    if (!turfId) {

        bookingTurfInfo.innerHTML = `
            <div class="booking-error">
                Turf information is missing.
            </div>
        `;

        return;
    }

    try {

        const turfRef =
            doc(
                db,
                "turfs",
                turfId
            );

        const snapshot =
            await getDoc(turfRef);


        if (!snapshot.exists()) {

            bookingTurfInfo.innerHTML = `
                <div class="booking-error">
                    This turf is no longer available.
                </div>
            `;

            return;
        }


        turfData =
            snapshot.data();


        if (turfData.active !== true) {

            bookingTurfInfo.innerHTML = `
                <div class="booking-error">
                    This turf is currently unavailable.
                </div>
            `;

            return;
        }


        const activities =
            Array.isArray(turfData.activities)
                ? turfData.activities
                : [];


        const activitiesHTML =
            activities.length

                ? activities.map(
                    activity => `
                        <span class="activity">
                            ${activity}
                        </span>
                    `
                ).join("")

                : `
                    <span class="activity">
                        Sports & Activities
                    </span>
                `;


        bookingTurfInfo.innerHTML = `

            <div class="booking-turf-kicker">
                SELECTED TURF
            </div>

            <h3>
                ${turfData.name || "Turf"}
            </h3>

            <div class="booking-turf-grid">

                <div class="booking-info-item price-item">

                    <span>
                        PRICE
                    </span>

                    <strong>
                        ₹${turfData.price || 0}
                        /
                        ${
                            turfData.priceType === "hour"
                                ? "hour"
                                : "team"
                        }
                    </strong>

                </div>


                <div class="booking-info-item">

                    <span>
                        OPEN HOURS
                    </span>

                    <strong>
                        ${turfData.openingTime || "--"}
                        –
                        ${turfData.closingTime || "--"}
                    </strong>

                </div>


                <div class="booking-info-item">

                    <span>
                        SLOT DURATION
                    </span>

                    <strong>
                        ${turfData.slotDuration || 60}
                        minutes
                    </strong>

                </div>

            </div>


            <div class="booking-activities">
                ${activitiesHTML}
            </div>
        `;


        await loadSlots();

    } catch (error) {

        console.error(
            "Turf loading error:",
            error
        );

        bookingTurfInfo.innerHTML = `
            <div class="booking-error">
                Unable to load turf information.
            </div>
        `;
    }
}


/* =====================================================
   LOAD SLOTS
===================================================== */

async function loadSlots() {

    if (!turfData) {
        return;
    }


    const date =
        bookingDate.value;


    if (!date) {
        return;
    }


    selectedSlot = null;


    slotList.innerHTML = `
        <div class="slots-loading">
            Checking availability...
        </div>
    `;


    try {

        const bookingQuery =
            query(
                collection(
                    db,
                    "bookings"
                ),
                where(
                    "turfId",
                    "==",
                    turfId
                )
            );


        const snapshot =
            await getDocs(
                bookingQuery
            );


        const bookedSlots =
            new Set();


        snapshot.forEach(
            bookingDoc => {

                const booking =
                    bookingDoc.data();

                if (
                    booking.date === date &&
                    booking.status === "confirmed"
                ) {

                    bookedSlots.add(
                        booking.slot
                    );
                }
            }
        );


        const opening =
            timeToMinutes(
                turfData.openingTime || "06:00"
            );


        const closing =
            timeToMinutes(
                turfData.closingTime || "23:00"
            );


        const duration =
            Number(
                turfData.slotDuration || 60
            );


        const slots = [];


        for (
            let start = opening;

            start + duration <= closing;

            start += duration
        ) {

            const end =
                start + duration;


            slots.push({

                label:
                    `${formatTime(start)} – ${formatTime(end)}`,

                start,

                end
            });
        }


        if (!slots.length) {

            slotList.innerHTML = `
                <div class="slots-empty">
                    No slots are available.
                </div>
            `;

            return;
        }


        slotList.innerHTML = "";


        slots.forEach(
            slot => {

                const isBooked =
                    bookedSlots.has(
                        slot.label
                    );


                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                /*
                 * These classes are used by the
                 * final booking-page UI.
                 */

                button.className =
                    "slot-card";


                if (isBooked) {

                    button.classList.add(
                        "booked"
                    );

                } else {

                    button.classList.add(
                        "available"
                    );
                }


                button.innerHTML = `

                    <span class="slot-time">
                        ${slot.label}
                    </span>

                    <span class="slot-status">
                        ${
                            isBooked
                                ? "BOOKED"
                                : "AVAILABLE"
                        }
                    </span>

                `;


                button.addEventListener(
                    "click",
                    () => {

                        /*
                         * BOOKED SLOT
                         */

                        if (isBooked) {

                            selectedBookedSlot =
                                slot.label;

                            selectedSlot =
                                null;


                            document
                                .querySelectorAll(
                                    ".slot-card"
                                )
                                .forEach(
                                    card => {

                                        card.classList.remove(
                                            "selected",
                                            "selected-booked"
                                        );
                                    }
                                );


                            button.classList.add(
                                "selected-booked"
                            );


                            cancelMessage.textContent =
                                "Booked slot selected. Enter the same mobile number used during booking.";

                            cancelMessage.style.color =
                                "#d7c29a";


                            cancelPhone.focus();

                            return;
                        }


                        /*
                         * AVAILABLE SLOT
                         */

                        selectedSlot =
                            slot.label;

                        selectedBookedSlot =
                            null;


                        document
                            .querySelectorAll(
                                ".slot-card"
                            )
                            .forEach(
                                card => {

                                    card.classList.remove(
                                        "selected",
                                        "selected-booked"
                                    );
                                }
                            );


                        button.classList.add(
                            "selected"
                        );


                        bookingMessage.textContent =
                            `Selected slot: ${slot.label}`;

                        bookingMessage.style.color =
                            "#7fc8a9";


                        cancelMessage.textContent =
                            "";
                    }
                );


                slotList.appendChild(
                    button
                );
            }
        );

    } catch (error) {

        console.error(
            "Slot loading error:",
            error
        );

        slotList.innerHTML = `
            <div class="slots-error">
                Unable to load available slots.
            </div>
        `;
    }
}


/* =====================================================
   DATE CHANGE
===================================================== */

bookingDate.addEventListener(
    "change",
    async () => {

        selectedSlot = null;

        selectedBookedSlot = null;

        bookingMessage.textContent = "";

        cancelMessage.textContent = "";

        await loadSlots();
    }
);


/* =====================================================
   CREATE BOOKING
===================================================== */

confirmBookingBtn.addEventListener(
    "click",
    async () => {

        const name =
            customerName.value.trim();

        const phone =
            customerPhone.value.trim();


        if (!name) {

            bookingMessage.textContent =
                "Please enter your full name.";

            bookingMessage.style.color =
                "#e58b8b";

            customerName.focus();

            return;
        }


        if (!selectedSlot) {

            bookingMessage.textContent =
                "Please select an available slot.";

            bookingMessage.style.color =
                "#e58b8b";

            return;
        }


        if (!/^\d{10}$/.test(phone)) {

            bookingMessage.textContent =
                "Please enter a valid 10-digit mobile number.";

            bookingMessage.style.color =
                "#e58b8b";

            customerPhone.focus();

            return;
        }


        confirmBookingBtn.disabled =
            true;

        confirmBookingBtn.textContent =
            "Checking...";


        try {

            const bookingQuery =
                query(
                    collection(
                        db,
                        "bookings"
                    ),
                    where(
                        "turfId",
                        "==",
                        turfId
                    )
                );


            const snapshot =
                await getDocs(
                    bookingQuery
                );


            const alreadyBooked =
                snapshot.docs.some(
                    bookingDoc => {

                        const booking =
                            bookingDoc.data();


                        return (
                            booking.date ===
                                bookingDate.value &&

                            booking.slot ===
                                selectedSlot &&

                            booking.status ===
                                "confirmed"
                        );
                    }
                );


            if (alreadyBooked) {

                bookingMessage.textContent =
                    "Sorry, this slot was just booked. Please select another slot.";

                bookingMessage.style.color =
                    "#e58b8b";


                await loadSlots();

                return;
            }


            const activities =
                Array.isArray(
                    turfData.activities
                )
                    ? turfData.activities
                    : [];


            await addDoc(
                collection(
                    db,
                    "bookings"
                ),
                {

                    turfId,

                    turfName:
                        turfData.name ||
                        "Turf",

                    activities,

                    date:
                        bookingDate.value,

                    /*
                     * Full slot range is saved.
                     *
                     * Example:
                     * 07:00 AM – 08:00 AM
                     */

                    slot:
                        selectedSlot,

                    customerName:
                        name,

                    customerPhone:
                        phone,

                    status:
                        "confirmed",

                    createdAt:
                        serverTimestamp()
                }
            );


            bookingMessage.textContent =
                `Booking confirmed for ${selectedSlot}.`;

            bookingMessage.style.color =
                "#7fc8a9";


            customerName.value =
                "";

            customerPhone.value =
                "";

            selectedSlot =
                null;


            await loadSlots();

        } catch (error) {

            console.error(
                "Booking error:",
                error
            );

            bookingMessage.textContent =
                "Unable to confirm booking. Please try again.";

            bookingMessage.style.color =
                "#e58b8b";

        } finally {

            confirmBookingBtn.disabled =
                false;

            confirmBookingBtn.textContent =
                "Confirm Booking";
        }
    }
);


/* =====================================================
   CANCEL BOOKING
===================================================== */

cancelBookingBtn.addEventListener(
    "click",
    async () => {

        const phone =
            cancelPhone.value.trim();

        const date =
            bookingDate.value;


        if (!/^\d{10}$/.test(phone)) {

            cancelMessage.textContent =
                "Please enter a valid 10-digit mobile number.";

            cancelMessage.style.color =
                "#e58b8b";

            cancelPhone.focus();

            return;
        }


        if (!date) {

            cancelMessage.textContent =
                "Please select the booking date.";

            cancelMessage.style.color =
                "#e58b8b";

            return;
        }


        if (!selectedBookedSlot) {

            cancelMessage.textContent =
                "Please select the booked slot you want to cancel.";

            cancelMessage.style.color =
                "#e58b8b";

            return;
        }


        cancelBookingBtn.disabled =
            true;

        cancelBookingBtn.textContent =
            "Checking...";


        try {

            const bookingQuery =
                query(
                    collection(
                        db,
                        "bookings"
                    ),
                    where(
                        "turfId",
                        "==",
                        turfId
                    )
                );


            const snapshot =
                await getDocs(
                    bookingQuery
                );


            const confirmedBooking =
                snapshot.docs.find(
                    bookingDoc => {

                        const data =
                            bookingDoc.data();


                        return (

                            data.status ===
                                "confirmed" &&

                            data.date ===
                                date &&

                            data.customerPhone ===
                                phone &&

                            data.slot ===
                                selectedBookedSlot
                        );
                    }
                );


            if (!confirmedBooking) {

                cancelMessage.textContent =
                    "No confirmed booking found for this slot and mobile number.";

                cancelMessage.style.color =
                    "#e58b8b";

                return;
            }


            const booking =
                confirmedBooking.data();


            const startTime =
                extractStartTime(
                    booking.slot
                );


            if (!startTime) {

                cancelMessage.textContent =
                    "Unable to determine the booking time.";

                cancelMessage.style.color =
                    "#e58b8b";

                return;
            }


            /*
             * Create the actual slot start time.
             */

            const slotStart =
                new Date(
                    `${date}T${startTime}:00`
                );


            const now =
                new Date();


            const hoursLeft =
                (
                    slotStart.getTime() -
                    now.getTime()
                ) /
                (1000 * 60 * 60);


            /*
             * Cancellation allowed only
             * 5 hours or more before slot.
             */

            if (hoursLeft < 5) {

                cancelMessage.textContent =
                    "Cancellation is allowed only up to 5 hours before the slot starts.";

                cancelMessage.style.color =
                    "#e58b8b";

                return;
            }


            await updateDoc(
                confirmedBooking.ref,
                {

                    status:
                        "cancelled",

                    cancelledAt:
                        serverTimestamp()
                }
            );


            cancelMessage.textContent =
                "Booking cancelled successfully. The slot is available again.";

            cancelMessage.style.color =
                "#7fc8a9";


            cancelPhone.value =
                "";

            selectedBookedSlot =
                null;


            await loadSlots();

        } catch (error) {

            console.error(
                "Cancellation error:",
                error
            );

            cancelMessage.textContent =
                "Unable to cancel booking. Please try again.";

            cancelMessage.style.color =
                "#e58b8b";

        } finally {

            cancelBookingBtn.disabled =
                false;

            cancelBookingBtn.textContent =
                "Cancel Booking";
        }
    }
);


/* =====================================================
   START
===================================================== */

loadTurf();