const User = require("../models/User");
const CustomError = require("../helpers/error/CustomError");
const asyncErrorWrapper = require("express-async-handler");
const { sendJwtToClient } = require("../helpers/authorization/tokenhelpers");
const {
  validateUserInput,
  comparePassword,
} = require("../helpers/input/inputHelpers");
const sendEmail = require("../helpers/libs/sendEmail");

const register = asyncErrorWrapper(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  sendJwtToClient(user, res, 200);
});

const login = asyncErrorWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  
  if (!validateUserInput(email, password)) {
    return next(new CustomError("Please check your input", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!comparePassword(password, user.password)) {
    return next(new CustomError("Please check your credentials", 400));
  }

  sendJwtToClient(user, res);
});

const logout = asyncErrorWrapper(async (req, res, next) => {
  const { NODE_ENV } = process.env;

  return res
    .status(200)
    .cookie({
      httpOnly: true,
      expires: new Date(Date.now()),
      secure: NODE_ENV === "development" ? false : true,
    })
    .json({
      success: true,
      message: "Logout Successfull",
    });
});

const getUser = (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {
      id: req.user.id,
      name: req.user.name,
    },
  });
};

const imageUpload = asyncErrorWrapper(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { profile_image: req.savedProfileImage },
    { new: true, runValidators: true }
  );
  res
    .status(200)
    .json({ success: true, message: "Image Upload Success", data: user });
});

const forgotPassword = asyncErrorWrapper(async (req, res, next) => {
  const resetEmail = req.body.email;

  const user = await User.findOne({ email: resetEmail });

  if (!user) {
    return next(new CustomError("There is no user with that email", 400));
  }

  const resetPasswordToken = user.getResetPasswordTokenFromUser();

  await user.save();

  const resetPasswordUrl = `http://localhost:5000/api/auth/resetpassword?resetPasswordToken=${resetPasswordToken}`;

  const emailTemplate = `
  <h3>Reset Your Password</h3>
  <p>This <a href=${resetPasswordUrl} target="_blank"> link </a> will expire in 1 hour.</p>
  `;
  try {
    const { SMTP_USER } = process.env;

    await sendEmail({
      from: SMTP_USER,
      to: resetEmail,
      subject: "Reset your password",
      html: emailTemplate,
    });
    return res.status(200).json({
      success: true,
      message: "Token sent to your email address",
    });
  } catch (err) {
    console.log("1111", err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return next(new CustomError("Email could not be sent", 500));
  }
});

const resetPassword = asyncErrorWrapper(async (req, res, next) => {
  const { resetPasswordToken } = req.query;
  const { password } = req.body;

  if (!resetPasswordToken) {
    return next(new CustomError("Please provide a valid token", 400));
  }

  let user = await User.findOne({
    resetPasswordToken: resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new CustomError("Invalid token or Session expired", 404));
  }
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  return res.status(200).json({
    success: true,
    message: "reset password process successfull",
  });
});

const editDetails = asyncErrorWrapper(async (req, res, next) => {
  const editInformation = req.body;

  const user = await User.findByIdAndUpdate(req.user.id, editInformation, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json({
    success: true,
    data: user,
  });
});

module.exports = {
  register,
  getUser,
  login,
  logout,
  imageUpload,
  forgotPassword,
  resetPassword,
  editDetails,
};
