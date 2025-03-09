document.addEventListener("DOMContentLoaded", function () {
    const API_BASE_URL = "https://your-backend-service.onrender.com"; // Set backend URL
    const tableBody = document.querySelector("#issued-books tbody");
    const filterDropdown = document.getElementById("filter");
    const searchInput = document.getElementById("search");
    
    let booksData = []; // Store fetched books

    async function fetchIssuedBooks() {
        const token = "your_jwt_token_here"; // Replace with actual token
        const response = await fetch(`${API_BASE_URL}/api/issue/my`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        booksData = await response.json();
        displayBooks();
    }

    function displayBooks() {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary" role="status"></div></td></tr>`;
    
        setTimeout(() => {
            tableBody.innerHTML = "";
            const searchText = searchInput.value.toLowerCase();
    
            booksData.forEach(book => {
                if (filterDropdown.value === "returned" && !book.returned) return;
                if (filterDropdown.value === "pending" && book.returned) return;
                if (!book.title.toLowerCase().includes(searchText)) return;
    
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${book.title}</td>
                    <td>${new Date(book.issue_date).toLocaleDateString()}</td>
                    <td>${new Date(book.due_date).toLocaleDateString()}</td>
                    <td>${book.returned ? "✅ Yes" : "❌ No"}</td>
                    <td>${book.return_date ? new Date(book.return_date).toLocaleDateString() : "-"}</td>
                `;
                tableBody.appendChild(row);
            });
        }, 500);
    }    

    function sortTable(columnIndex) {
        booksData.sort((a, b) => {
            let valA = Object.values(a)[columnIndex];
            let valB = Object.values(b)[columnIndex];

            if (columnIndex === 1 || columnIndex === 2) { // Date columns
                valA = new Date(valA);
                valB = new Date(valB);
            }

            return valA > valB ? 1 : -1;
        });
        displayBooks();
    }
    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "login.html";
    }
    

    filterDropdown.addEventListener("change", displayBooks);
    searchInput.addEventListener("input", displayBooks);
    fetchIssuedBooks();
});
