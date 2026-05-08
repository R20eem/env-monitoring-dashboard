/*
    File: auth.js

    Purpose:
    Handles user registration functionality for both farmers and researchers.

    Responsibilities:
    - Dynamically show/hide form fields based on selected user role
      (farmer vs researcher)
    - Collect user input from registration form
    - Build role-specific payload for backend API
    - Send registration request to appropriate endpoint:
        /auth/farmers/register
        /auth/researchers/register
    - Handle server responses (success and error)
    - Redirect users to login page after successful registration
    - Reset form fields after submission

    Key Features:
    - Role-based form logic (different fields for farmers and researchers)
    - Asynchronous API communication using fetch()
    - Basic error handling and user feedback via alerts
    - Automatic UI update when role selection changes

    Layer:
    Frontend (JavaScript Logic / API Integration)

    Related:
    - register.html (registration form UI)
    - login.html (redirect after successful registration)
    - style.css (form styling)

    References:
    https://www.w3schools.com/sql/default.asp
*/

window.onload = () => {

    // Get elements
    const roleSelect = document.getElementById("role");
    const orgCode = document.getElementById("org_code");
    const connectionEnd = document.getElementById("connection_end");
    const experience = document.getElementById("experience");
    const locationInput = document.getElementById("location"); 

    // Function to show/hide fields
    function updateFields() {
        if (roleSelect.value === "researcher") {
            orgCode.style.display = "block";
            connectionEnd.style.display = "block";
            
            document.getElementById('connection_end_hint').style.display = "block";     
            experience.style.display = "none";
            locationInput.style.display = "none";
        } else {
            orgCode.style.display = "none";
            connectionEnd.style.display = "none";
            
            document.getElementById('connection_end_hint').style.display = "none";
            experience.style.display = "block";
            locationInput.style.display = "block";
        }
    }


    updateFields();

    // Different fields for Researchers and Farmer
    roleSelect.addEventListener("change", updateFields);


    // REGISTER function

    window.register = async function register() {

    const role = document.getElementById("role").value
    const first_name = document.getElementById("first_name").value
    const last_name = document.getElementById("last_name").value
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value
    const experienceValue = document.getElementById("experience").value
    const locationValue = document.getElementById("location").value // FIXED NAME
    const org_code = document.getElementById("org_code").value
    const connection_end = document.getElementById("connection_end").value

    let url = ""
    let payload = {}

    if(role === "farmer"){
    url = "http://127.0.0.1:8000/auth/farmers/register"

    payload = {
    first_name,
    last_name,
    email,
    experience: experienceValue,
    location: locationValue,
    password
    }
    }

    if(role === "researcher"){
    // url = "http://172.20.10.4:8000/auth/researchers/register"
    url = "http://127.0.0.1:8000/auth/researchers/register"

    
    payload = {
    first_name,
    last_name,
    email,
    org_code,
    connection_end,
    password
    }
    }

    try {
        const res = await fetch(url,{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body: JSON.stringify(payload)
        })

        const data = await res.json()

        console.log(data)

        if(res.ok){
            alert("Registration successful")
            window.location.href = 'login.html'

            // Clear form
            document.querySelectorAll("input").forEach(input => input.value = "")
            document.getElementById("experience").value = ""
            document.getElementById("role").value = "farmer"
            updateFields()

        } else {
            alert("Error: " + JSON.stringify(data.detail))
        }

    } catch(error){
        console.error(error)
        alert("Server error")
        }

    }

}