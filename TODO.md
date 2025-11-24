# TODO: Enable 2FA for All Users on Login

- [x] Modify routes/auth.js to always require 2FA on login (remove twofa_enabled check)
- [x] Create sql script/enable_2fa_all_users.sql to set twofa_enabled=TRUE for all users
- [x] Execute the SQL script to update the database
- [x ] Test login functionality to confirm 2FA is always required
