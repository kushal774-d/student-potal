let subjectCount = 1;

// Add subject function
function addSubject() {
    subjectCount++;
    const subjectsContainer = document.getElementById('subjectsContainer');
    const newSubject = document.createElement('div');
    newSubject.className = 'subject-entry';
    newSubject.innerHTML = `
        <div class="subject-header">
            <h3>Subject ${subjectCount}</h3>
        </div>
        <div class="subject-fields">
            <input type="text" placeholder="Subject Name" required>
            <input type="number" class="internal" placeholder="Internal Marks" min="0" max="50" required>
            <input type="number" class="external" placeholder="External Marks" min="0" max="100" required>
            <input type="number" class="total" placeholder="Total" readonly>
        </div>
    `;
    subjectsContainer.appendChild(newSubject);
    
    // Add event listeners to new inputs
    const internalInput = newSubject.querySelector('.internal');
    const externalInput = newSubject.querySelector('.external');
    
    internalInput.addEventListener('input', updateTotal);
    externalInput.addEventListener('input', updateTotal);
}

// Update total marks
function updateTotal(e) {
    const parent = e.target.closest('.subject-fields');
    const internal = parseFloat(parent.querySelector('.internal').value) || 0;
    const external = parseFloat(parent.querySelector('.external').value) || 0;
    parent.querySelector('.total').value = internal + external;
}

// Form submission
document.getElementById('marksForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const errorMessages = document.getElementById('errorMessages');
    errorMessages.innerHTML = '';

    // Get all form values
    const studentName = document.getElementById('studentName').value;
    const studentRID = document.getElementById('studentRID').value;
    const studentEmail = document.getElementById('studentEmail').value;
    const courseName = document.getElementById('courseName').value;
    const year = document.getElementById('year').value;
    const semester = document.getElementById('semester').value;
    const subjects = document.querySelectorAll('.subject-entry');

    // Validate all fields
    if (!studentName || !studentRID || !studentEmail || !courseName || !year || !semester) {
        showError('All student and course details are required');
        return;
    }

    if (!validateEmail(studentEmail)) {
        showError('Invalid email format');
        return;
    }

    if (year < 1 || year > 5) {
        showError('Year must be between 1 and 5');
        return;
    }

    if (subjects.length === 0) {
        showError('At least one subject is required');
        return;
    }

    // Validate subjects
    let isValid = true;
    subjects.forEach((subject, index) => {
        const inputs = subject.querySelectorAll('input');
        const [subjectName, internalMarks, externalMarks] = inputs;

        if (!subjectName.value || !internalMarks.value || !externalMarks.value) {
            showError(`Subject ${index + 1}: All fields are required`);
            isValid = false;
        }

        if (internalMarks.value < 0 || internalMarks.value > 50) {
            showError(`Subject ${index + 1}: Internal marks must be between 0-50`);
            isValid = false;
        }

        if (externalMarks.value < 0 || externalMarks.value > 100) {
            showError(`Subject ${index + 1}: External marks must be between 0-100`);
            isValid = false;
        }
    });

    if (!isValid) return;

    // Prepare data for submission
    const formData = {
        studentName,
        studentRID,
        studentEmail,
        courseName,
        year,
        semester,
        subjects: Array.from(subjects).map(subject => {
            const inputs = subject.querySelectorAll('input');
            return {
                subjectName: inputs[0].value,
                internalMarks: inputs[1].value,
                externalMarks: inputs[2].value,
                totalMarks: inputs[3].value
            }
        })
    };

    // Submit to backend
    fetch('/submit_marks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            document.getElementById('newEntryBtn').style.display = 'block';
        } else {
            showError(data.message);
        }
    })
    .catch(error => {
        showError('Error submitting marks. Please try again.');
        console.error('Error:', error);
    });
});

// Helper functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.getElementById('errorMessages').appendChild(errorDiv);
}

function newEntry() {
    document.getElementById('marksForm').reset();
    document.getElementById('subjectsContainer').innerHTML = `
        <div class="subject-entry">
            <div class="subject-header">
                <h3>Subject 1</h3>
            </div>
            <div class="subject-fields">
                <input type="text" placeholder="Subject Name" required>
                <input type="number" class="internal" placeholder="Internal Marks" min="0" max="50" required>
                <input type="number" class="external" placeholder="External Marks" min="0" max="100" required>
                <input type="number" class="total" placeholder="Total" readonly>
            </div>
        </div>
    `;
    subjectCount = 1;
    document.getElementById('newEntryBtn').style.display = 'none';
    document.getElementById('errorMessages').innerHTML = '';
    
    // Re-attach event listeners
    document.querySelectorAll('.internal, .external').forEach(input => {
        input.addEventListener('input', updateTotal);
    });
}

// Initialize event listeners for first subject
document.querySelectorAll('.internal, .external').forEach(input => {
    input.addEventListener('input', updateTotal);
});