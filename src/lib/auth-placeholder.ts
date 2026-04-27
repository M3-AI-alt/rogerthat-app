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

  This file is planning documentation only.
  It does not connect to a database and does not perform real authentication.
*/

export const AUTH_PLACEHOLDER_READY = true;
