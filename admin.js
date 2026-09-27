import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";


// =====================================================
// PAGE DETECTION
// =====================================================

const isLoginPage =
    document.getElementById("loginForm") !== null;

const isDashboard =
    document.getElementById("bookingTableBody") !== null;


// =====================================================
// LOGIN
// =====================================================

if (isLoginPage) {

    const loginForm =
        document.getElementById("loginForm");

    const loginMessage =
        document.getElementById("loginMessage");


    onAuthStateChanged(
        auth,
        user => {

            if (user) {
                window.location.href =
                    "dashboard.html";
            }

        }
    );


    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            loginMessage.textContent =
                "Signing in...";

            loginMessage.style.color =
                "#b89b62";


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


                loginMessage.textContent =
                    "Login successful.";

                loginMessage.style.color =
                    "#7fc8a9";


                window.location.href =
                    "dashboard.html";


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                loginMessage.textContent =
                    "Invalid email or password.";

                loginMessage.style.color =
                    "#e58b8b";

            }

        }
    );
}


// =====================================================
// DASHBOARD
// =====================================================

if (isDashboard) {

    const logoutBtn =
        document.getElementById("logoutBtn");


    onAuthStateChanged(
        auth,
        async user => {

            if (!user) {

                window.location.href =
                    "login.html";

                return;
            }


            await loadDashboard();

        }
    );


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async () => {

                try {

                    await signOut(auth);

                    window.location.href =
                        "login.html";


                } catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                }

            }
        );

    }

}


// =====================================================
// LOAD DASHBOARD
// =====================================================

async function loadDashboard() {

    try {

        await Promise.all([
            loadBookingStats(),
            loadRecentBookings()
        ]);


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}


// =====================================================
// BOOKING STATS
// =====================================================

async function loadBookingStats() {

    const snapshot =
        await getDocs(
            collection(
                db,
                "bookings"
            )
        );


    const bookings =
        snapshot.docs.map(
            doc => doc.data()
        );


    const totalBookings =
        document.getElementById(
            "totalBookings"
        );


    if (totalBookings) {

        totalBookings.textContent =
            bookings.length;

    }


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    const todayString =
        `${year}-${month}-${day}`;


    const todayBookings =
        bookings.filter(
            booking =>
                booking.date ===
                todayString
        );


    const todayElement =
        document.getElementById(
            "todayBookings"
        );


    if (todayElement) {

        todayElement.textContent =
            todayBookings.length;

    }

}


// =====================================================
// RECENT BOOKINGS
// =====================================================

async function loadRecentBookings() {

    const tableBody =
        document.getElementById(
            "bookingTableBody"
        );


    if (!tableBody) {
        return;
    }


    try {

        const bookingQuery =
            query(
                collection(
                    db,
                    "bookings"
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                bookingQuery
            );


        tableBody.innerHTML =
            "";


        if (snapshot.empty) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="4"
                        class="table-empty"
                    >
                        No bookings yet.
                    </td>
                </tr>
            `;

            return;
        }


        const bookings =
            snapshot.docs.slice(
                0,
                10
            );


        bookings.forEach(
            doc => {

                const booking =
                    doc.data();


                const row =
                    document.createElement(
                        "tr"
                    );


                const statusClass =
                    booking.status ===
                    "confirmed"

                        ? "status-confirmed"

                        : "status-cancelled";


                row.innerHTML = `
                    <td>
                        <div class="customer-cell">

                            <strong>
                                ${booking.customerName || "-"}
                            </strong>

                            <small>
                                ${booking.customerPhone || ""}
                            </small>

                        </div>
                    </td>


                    <td>
                        ${booking.date || "-"}
                    </td>


                    <td>
                        ${booking.slot || "-"}
                    </td>


                    <td>
                        <span
                            class="status-badge ${statusClass}"
                        >
                            ${booking.status || "-"}
                        </span>
                    </td>
                `;


                tableBody.appendChild(
                    row
                );

            }
        );


    } catch (error) {

        console.error(
            "Bookings error:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="table-empty"
                >
                    Unable to load bookings.
                </td>
            </tr>
        `;

    }

}