/*
  Future RogerThat authentication flow:

  1. User signs up by email/password, Google, or phone number OTP.
  2. The account waits for CEO approval before the user can access the app.
  3. The CEO assigns the approved user one role: Director, Teacher, or Parent.
  4. The CEO can grant or remove Admin access only for Directors.
  5. Teachers and Parents can never become Admin.
  6. After approval, the user logs in and is redirected by role:
     - CEO goes to /ceo/dashboard
     - Director goes to /director/dashboard
     - Teacher goes to /teacher/dashboard
     - Parent goes to /parent/dashboard

  Future UserStatus:
     - PENDING
     - APPROVED
     - REJECTED

  CEO-controlled parent approval flow:

  1. Parent signs up with:
     - parent full name
     - phone number
     - optional email
     - child name
     - class ID or class code given by the CEO
  2. Parent account status starts as PENDING.
  3. Parent cannot access the app while status is PENDING.
  4. CEO reviews parent information and class code.
  5. CEO assigns the parent to one or more classes.
  6. CEO approves or rejects the parent account.
  7. After approval, the parent can access assigned class reports and chats.

  Future class and communication controls:

  - CEO creates classes.
  - CEO assigns teachers to classes.
  - CEO assigns parents to classes.
  - One parent can have more than one child, so one parent can be assigned to
    multiple classes.
  - Teacher can only see parents inside assigned classes.
  - Teacher cannot access or export the full parent database.
  - Director can supervise but cannot take or export the full parent database.
  - CEO must be present in every class group chat.
  - CEO must be present in every private teacher-parent chat.
  - Class group chat includes class parents, teacher, director, and CEO.
  - Private chat includes teacher, one parent, director, and CEO.

  This file is planning documentation only.
  It does not connect to a database and does not perform real authentication.
*/

export const AUTH_PLACEHOLDER_READY = true;
