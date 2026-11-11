const dns = require('dns');
dns.setServers(['8.8.8.8','1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { Class, Section } = require('../models/Class');
const Subject = require('../models/Subject');
const { LibraryBook } = require('../models/Library');
const { Bus } = require('../models/Transport');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Student.deleteMany({}), Teacher.deleteMany({}),
    Class.deleteMany({}), Section.deleteMany({}), Subject.deleteMany({}),
    LibraryBook.deleteMany({}), Bus.deleteMany({})
  ]);
  console.log('Cleared existing data');

  // Create Admin User
  const admin = await User.create({
    name: 'School Admin', email: 'admin@school.com', password: 'admin123',
    role: 'school_admin', phone: '9876543210'
  });
  console.log('Admin created:', admin.email);

  // Create Classes
  const classes = await Class.create([
    { name: 'Grade 1', grade: 1, academicYear: '2024-25' },
    { name: 'Grade 2', grade: 2, academicYear: '2024-25' },
    { name: 'Grade 5', grade: 5, academicYear: '2024-25' },
    { name: 'Grade 10', grade: 10, academicYear: '2024-25' },
    { name: 'Grade 12', grade: 12, academicYear: '2024-25' },
  ]);

  // Create Sections
  const sections = await Section.create([
    { name: 'A', class: classes[0]._id, academicYear: '2024-25' },
    { name: 'B', class: classes[0]._id, academicYear: '2024-25' },
    { name: 'A', class: classes[3]._id, academicYear: '2024-25' },
  ]);

  // Create Demo Students
  const studentData = [
    { firstName: 'Arjun', lastName: 'Sharma', gender: 'Male', admissionNumber: 'ADM001', studentId: 'STU00001', dateOfBirth: '2010-05-15', admissionDate: '2024-06-01', academicYear: '2024-25', class: classes[0]._id, section: sections[0]._id, rollNumber: '1', fatherName: 'Rajesh Sharma', parentPhone: '9876543210', bloodGroup: 'O+', city: 'Bengaluru', state: 'Karnataka' },
    { firstName: 'Priya', lastName: 'Patel', gender: 'Female', admissionNumber: 'ADM002', studentId: 'STU00002', dateOfBirth: '2010-08-22', admissionDate: '2024-06-01', academicYear: '2024-25', class: classes[0]._id, section: sections[0]._id, rollNumber: '2', fatherName: 'Suresh Patel', parentPhone: '9876543211', bloodGroup: 'A+', city: 'Bengaluru', state: 'Karnataka' },
    { firstName: 'Rahul', lastName: 'Kumar', gender: 'Male', admissionNumber: 'ADM003', studentId: 'STU00003', dateOfBirth: '2008-03-10', admissionDate: '2024-06-01', academicYear: '2024-25', class: classes[3]._id, section: sections[2]._id, rollNumber: '1', fatherName: 'Vijay Kumar', parentPhone: '9876543212', bloodGroup: 'B+', city: 'Mumbai', state: 'Maharashtra' },
    { firstName: 'Sneha', lastName: 'Reddy', gender: 'Female', admissionNumber: 'ADM004', studentId: 'STU00004', dateOfBirth: '2009-11-30', admissionDate: '2024-06-01', academicYear: '2024-25', class: classes[1]._id, section: sections[1]._id, rollNumber: '1', fatherName: 'Ravi Reddy', parentPhone: '9876543213', bloodGroup: 'AB+', city: 'Hyderabad', state: 'Telangana' },
  ];
  await Student.create(studentData);
  console.log('Students created');

  // Create Teachers
  await Teacher.create([
    { name: 'Mrs. Kavitha Nair', teacherId: 'TCH001', phone: '9876543220', email: 'kavitha@school.com', gender: 'Female', qualification: 'M.Sc Mathematics', experience: 8, joiningDate: '2016-06-01', department: 'Mathematics' },
    { name: 'Mr. Arun Singh', teacherId: 'TCH002', phone: '9876543221', email: 'arun@school.com', gender: 'Male', qualification: 'M.A English', experience: 5, joiningDate: '2019-06-01', department: 'English' },
  ]);
  console.log('Teachers created');

  // Create Books
  await LibraryBook.create([
    { bookId: 'BK001', title: 'Mathematics Class 10', author: 'NCERT', publisher: 'NCERT', category: 'Textbook', quantity: 10, availableQuantity: 10, shelfNumber: 'A1' },
    { bookId: 'BK002', title: 'Science Class 8', author: 'NCERT', publisher: 'NCERT', category: 'Textbook', quantity: 8, availableQuantity: 8, shelfNumber: 'A2' },
    { bookId: 'BK003', title: 'Harry Potter', author: 'J.K. Rowling', publisher: 'Bloomsbury', category: 'Fiction', quantity: 3, availableQuantity: 3, shelfNumber: 'B1' },
  ]);
  console.log('Books created');

  // Create Buses
  await Bus.create([
    { vehicleNumber: 'BUS-01', registrationNumber: 'KA01AB1234', capacity: 40, driver: 'Ramu', driverPhone: '9876543230', status: 'Active' },
    { vehicleNumber: 'BUS-02', registrationNumber: 'KA01AB5678', capacity: 35, driver: 'Shyam', driverPhone: '9876543231', status: 'Active' },
  ]);
  console.log('Buses created');

  console.log('\n✅ Seed completed successfully!');
  console.log('🔑 Login: admin@school.com / admin123');
  mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });
