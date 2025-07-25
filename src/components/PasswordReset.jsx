import React, { useState,useEffect } from 'react';
import styles from './TwoFASetup.module.scss';
import { toast } from 'react-toastify';
import { resetPassword, sendOTP } from '@/services/login';
import FullScreenLoader from './Loader';

const PasswordReset = ({ instance ,userName}) => {
    const [values, setValues] = React.useState({
        userName: userName,
        userInstance: instance,
        userID: 0,
        newPassword: "",
        confirmPassword: "",
        rmsOtp: '',
        mfaOtp: ''
    });

    const [error, setError] = React.useState(null);
    const [otpSent, setOtpSent] = React.useState(false);
    const [hasAccess, setHasAccess] = useState(true);
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    useEffect(() => {
        if (otpSent) {
            setResendTimer(30);
            setCanResend(false);
        }
    }, [otpSent]);

    useEffect(() => {
        if (!otpSent) return;

        if (resendTimer === 0) {
            setCanResend(true);
            return;
        }

        const timerId = setTimeout(() => {
            setResendTimer(resendTimer - 1);
        }, 1000);

        return () => clearTimeout(timerId);
    }, [resendTimer, otpSent]);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const resp = await sendOTP({ userName: values?.userName, userInstance: instance });

            if (resp.status === 200) {
                setOtpSent(true);
                toast.success("OTP sent successfully");
                setValues({ ...values, userID: resp?.data });
            } else {
                setError(data?.message);
            }
        } catch (error) {
            toast.error(error?.response?.data || "An error occurred while sending OTP");
            setError(error?.response?.data || "An error occurred while sending OTP");
        }
        finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!values?.newPassword || !values?.confirmPassword || !values?.rmsOtp || !values?.mfaOtp) {
            toast.error("Please fill all fields");
            return;
        }
        if (
            values?.newPassword.length < 8 ||
            !/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(values?.newPassword)
        ) {
            toast.error("Password must be at least 8 characters and contain both letters and numbers");
            return;
        }


        if (values?.newPassword !== values?.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        let obj = {
            userName: values?.userName,
            userInstance: instance,
            userID: values?.userID,
            newPassword: values?.newPassword,
            rmsOtp: values?.rmsOtp,
            mfaOtp: values?.mfaOtp
        }
        try {
            setLoading(true);
            const response = await resetPassword(obj);
            if (response?.status === 200) {
                setLoading(true);
                toast.success("Password reset successfully");
                window.top.location.href = response; // Ensure top-level navigation
                setTimeout(() => {
                    setLoading(false)
                }, 3000);
                setValues({
                    userName: "",
                    userInstance: instance,
                    userID: 0,
                    newPassword: "",
                    confirmPassword: "",
                    rmsOtp: '',
                    mfaOtp: ''
                });
                setOtpSent(false);
            } else {
                toast.error(response?.message || "Failed to reset password");
            }
        } catch (error) {
            toast.error(error?.response?.data || "An error occurred while resetting password");
        } finally {
            setLoading(false);
        }
    }

    const renderNoAccess = () => (
        <div className="text-white text-center mt-4 min-h-[10rem] flex flex-col items-center justify-center text-lg font-bold">
            {error}
        </div>
    );

    return (

        <>
            {loading && <FullScreenLoader />}
            {hasAccess && (
                <form onSubmit={(e) => !otpSent ? handleSendOtp(e) : handleResetPassword(e)} className="flex flex-col gap-4 p-4 bg-white rounded-md shadow-md">
                    <div>
                        <label htmlFor="username" className="text-xs">User Name <span className="text-red-500">*</span> </label>
                        <input disabled={otpSent} type="email" id='username' required value={values?.userName} onChange={(e) => setValues({ ...values, userName: e.target.value })} className="w-full p-2 rounded-md border border-gray-300" placeholder="Enter your username" />
                    </div>
                    {otpSent && (
                        <div>
                            <div>
                                <label htmlFor="newPassword" className="text-xs">New Password <span className="text-red-500">*</span></label>
                                <input type="password" id='newPassword' required value={values?.newPassword} onChange={(e) => setValues({ ...values, newPassword: e.target.value })} className="w-full p-2 rounded-md border border-gray-300" placeholder="Enter your new password" />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="text-xs">Confirm Password <span className="text-red-500">*</span></label>
                                <input required type="password" id='confirmPassword' value={values?.confirmPassword} onChange={(e) => setValues({ ...values, confirmPassword: e.target.value })} className="w-full p-2 rounded-md border border-gray-300" placeholder="Confirm your new password" />
                            </div>
                            <p className='text-[10px] text-red-500 my-1'>Password must be at least 8 characters and Alpha Numeric Value</p>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label htmlFor="rmsOtp" className="text-xs">RMS OTP<span className="text-red-500">*</span></label>
                                    <input type="number" id='rmsOtp' required value={values?.rmsOtp} onChange={(e) => setValues({ ...values, rmsOtp: e.target.value })} className="w-full p-2 rounded-md border border-gray-300" placeholder="Enter  RMS OTP" />
                                </div>

                                <div>
                                    <label htmlFor="mfaOtp" className="text-xs">MFA OTP <span className="text-red-500">*</span></label>
                                    <input required type="number" id='mfaOtp' value={values?.mfaOtp} onChange={(e) => setValues({ ...values, mfaOtp: e.target.value })} className="w-full p-2 rounded-md border border-gray-300" placeholder="Enter  MFA OTP" />
                                </div>
                            </div>

                        </div>
                    )}
                    <button disabled={otpSent ? !values?.newPassword || !values?.confirmPassword || !values?.rmsOtp || !values?.mfaOtp : !values?.userName} className={styles.button} >{otpSent ? "Reset Password" : "Send OTP"}</button>

                    {otpSent && (
                        <div>
                            {canResend ? (
                                <p
                                    className="text-xs text-blue-500 cursor-pointer"
                                    onClick={(e) =>  handleSendOtp(e)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyPress={(e) => e.key === "Enter" && handleSendOtp(e)}
                                >
                                    Didn't get the code? Resend OTP
                                </p>
                            ) : (
                                <p className="text-xs text-gray-500">
                                    Didn’t get the code? Resend OTP in {resendTimer} seconds.
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                If you don't have an authenticator app, please contact your administrator.
                            </p>
                        </div>
                    )}

                </form>)}

        </>

    )
}

export default PasswordReset