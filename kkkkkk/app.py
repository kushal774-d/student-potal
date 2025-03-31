from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import pyodbc
import hashlib
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your_very_strong_secret_key_here'  # Change this!

# Database Connection
def get_db_connection():
    try:
        conn = pyodbc.connect(
            "DRIVER={SQL Server};"
            "SERVER=LAPTOP-0F5BEL9R;"
            "DATABASE=StudentPortal;"
            "Trusted_Connection=yes;"
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {str(e)}")
        raise

# Password Hashing
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Routes
@app.route('/')
def home():
    if 'username' in session:
        return redirect(url_for('dashboard'))
    return render_template('login.html')

@app.route('/register', methods=['POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']

        if password != confirm_password:
            flash("Passwords don't match!", 'error')
            return redirect(url_for('home'))

        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO Users (username, email, password) VALUES (?, ?, ?)",
                (username, email, hash_password(password))
            )
            conn.commit()
            flash('Registration successful! Please login.', 'success')
        except pyodbc.IntegrityError as e:
            flash('Username or email already exists!', 'error')
        except Exception as e:
            flash(f'Registration failed: {str(e)}', 'error')
        finally:
            conn.close()

        return redirect(url_for('home'))

@app.route('/login', methods=['POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, username FROM Users WHERE username=? AND password=?",
                (username, hash_password(password))
            )
            user = cursor.fetchone()
            
            if user:
                session['user_id'] = user.id
                session['username'] = user.username
                return redirect(url_for('dashboard'))
            else:
                flash('Invalid credentials!', 'error')
        except Exception as e:
            flash(f'Login error: {str(e)}', 'error')
        finally:
            conn.close()

        return redirect(url_for('home'))

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        flash('Please login first!', 'error')
        return redirect(url_for('home'))
    return render_template('index.html', username=session['username'])

@app.route('/submit_marks', methods=['POST'])
def submit_marks():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    try:
        data = request.get_json()
        print("Received data:", data)  # Debugging
        
        # Validate required fields
        required_fields = ['studentName', 'studentRID', 'studentEmail', 'courseName', 'year', 'semester']
        if not all(field in data for field in required_fields):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert student record
        cursor.execute("""
            INSERT INTO StudentRecords 
            (user_id, student_name, student_rid, student_email, course_name, year, semester)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            session['user_id'],
            data['studentName'],
            data['studentRID'],
            data['studentEmail'],
            data['courseName'],
            data['year'],
            data['semester']
        ))

        # Get the inserted record ID

        # Insert subjects
        for subject in data.get('subjects', []):
            cursor.execute("""
                INSERT INTO Subjects 
                (R_id, subject_name, internal_marks, external_marks, total_marks)
                VALUES (?, ?, ?, ?, ?)
            """, (
                data['studentRID'],
                subject['subjectName'],
                subject['internalMarks'],
                subject['externalMarks'],
                subject['totalMarks']
            ))

        conn.commit()
        return jsonify({'success': True, 'message': 'Marks submitted successfully!'})

    except Exception as e:
        print(f"Error in submit_marks: {str(e)}")  # Debugging
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        conn.close()

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True)