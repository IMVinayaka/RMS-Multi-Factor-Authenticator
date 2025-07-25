import React from 'react';
import styles from './TwoFASetup.module.scss';
import { toast } from 'react-toastify';
import { sendOTP } from '@/services/login';

const PasswordReset = ({ instance }) => {
    const [values, setValues] = React.useState({
        userName: "",
        userInstance: instance,
        userID: 0,
        newPassword: "",
        confirmPassword: "",
        rmsOtp: '',
        mfaOtp: ''
    });

    const [error, setError] = React.useState(null);
    const [otpSent, setOtpSent] = React.useState(false);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        try {
            const resp = await sendOTP({ userName: values?.userName, userInstance: instance });

            if (resp.status === 200) {
                setOtpSent(true);
                toast.success("OTP sent successfully");
                setValues({ ...values, userID: resp?.data });
            } else {
                setError(data?.message);
            }
        } catch (error) {
            setError(error.message);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (values?.newPassword !== values?.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
    }

    return (
        <form onSubmit={(e) => !otpSent ? handleSendOtp(e) : handleSendOtp(e)} className="flex flex-col gap-4 p-4 bg-white rounded-md shadow-md">
            <div>
                <label htmlFor="username" className="text-xs">User Name</label>
                <input type="email" id='username' required value={values?.userName} onChange={(e) => setValues({ ...values, userName: e.target.value })} className="w-full p-2 rounded-md border border-gray-300" placeholder="Enter your username" />
            </div>
            {otpSent && (
                <div>
                    <div>
                        <label htmlFor="newPassword" className="text-xs">New Password</label>
                        <input type="password" id='newPassword' value={values?.newPassword} onChange={(e) => setValues({ ...values, newPassword: e.target.value })} className="w-full p-2 rounded-md border border-gray-300" placeholder="Enter your new password" />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="text-xs">Confirm Password</label>
                        <input type="password" id='confirmPassword' value={values?.confirmPassword} onChange={(e) => setValues({ ...values, confirmPassword: e.target.value })} className="w-full p-2 rounded-md border border-gray-300" placeholder="Confirm your new password" />
                    </div>
                   <p className='text-[10px] my-1'>Password must be at least 8 characters and Alpha Numeric Value</p>
                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <label htmlFor="rmsOtp" className="text-xs">RMS OTP</label>
                            <input type="text" id='rmsOtp' value={values?.rmsOtp} onChange={(e) => setValues({ ...values, rmsOtp: e.target.value })} className="w-full p-2 rounded-md border border-gray-300" placeholder="Enter  RMS OTP" />
                        </div>

                        <div>
                            <label htmlFor="mfaOtp" className="text-xs">MFA OTP</label>
                            <input type="text" id='mfaOtp' value={values?.mfaOtp} onChange={(e) => setValues({ ...values, mfaOtp: e.target.value })} className="w-full p-2 rounded-md border border-gray-300" placeholder="Enter  MFA OTP" />
                        </div>
                    </div>

                </div>
            )}
            <button disabled={otpSent ? !values?.newPassword || !values?.confirmPassword || !values?.rmsOtp || !values?.mfaOtp : !values?.userName} className={styles.button} >{otpSent ? "Reset Password" : "Send OTP"}</button>
        </form>
    )
}

export default PasswordReset