document.getElementById("login-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("error-msg");

    try {
        const response = await fetch("http://localhost:5000/api/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.role);
            window.location.href = data.role === "admin" ? "admin.html" : "index.html";
        } else {
            errorMsg.textContent = data.error;
        }
    } catch (error) {
        errorMsg.textContent = "Server error. Please try again.";
    }
});
