const axios = require('axios');

const sendOTP = async (mobileNumber, otp) => {
    try {
        const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
            "variables_values": otp,
            "route": "otp",
            "numbers": mobileNumber,
        }, {
            headers: {
                "authorization": process.env.FAST2SMS_API_KEY
            }
        });
        return response.data;
    }  catch (error) {
  // Log the FULL Fast2SMS error response
  console.error("Fast2SMS full error:", JSON.stringify(error.response?.data));
  throw new AppError(
    error.response?.data?.message || "Failed to send OTP",
    500
  );
}
};

module.exports = { sendOTP };