import {create} from "zustand"
import { axiosInstance } from "../lib/axios.js"
import axios from "axios";
import toast from "react-hot-toast";
import { data } from "react-router-dom";
import {io} from "socket.io-client"

const BASE_URL= import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";
export const useAuthStore = create((set, get) => ({
    authUser:null,
    isSigningUp:false,
    isloggingIn:false,
    isUpdatingProfile:false,
    isCheckingAuth:true,
    onlineUsers:[],
    socket:null,

    checkAuth: async ()=>{
        try {
            const res= await axiosInstance.get("/auth/check");
            set({authUser:res.data})
            get().connectSocket()
        } 
        catch (error) {
            console.log("error in checkAuth",error);
            set({authUser:null});
        }
        finally{
            set({isCheckingAuth:false});
        }
    },

    signup: async (data)=>{
        set({isSigningUp:true})
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({authUser:res.data})
            toast.success("signup successful");
            get().connectSocket();
        } 
        catch (error) {
            toast.error(error.response.data.message)
        }
        finally{
            set({isSigningUp:false})
        }
    },

    login: async (data)=>{
        set({isloggingIn:true})
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({authUser:res.data});
            toast.success("You're logged in now");

            get().connectSocket()
        } 
        catch (error) {
            toast.error(error.response.data.message)
        }
        finally{
            set({isloggingIn:false});
        }

    },

    logout: async ()=>{
        try {
            await axiosInstance.post("/auth/logout")    
            set({authUser:null})
            toast.success("logged out successfully");
            get().disconnectSocket();
        } 
        
        catch (error) {
            toast.error(error.response.data.message)
            console.log("error in logout",error);
        }
    },

    updateProfile: async (data)=>{
        set({isUpdatingProfile:true})
        try {
        const res=await axiosInstance.put("/auth/update-profile", data)
        set({authUser:res.data})
        toast.success("Profile picture updated")
        } 
        catch (error) {
        toast.error(error.response.data.message || "profile update failed")
        console.log("error in update",error);
        }
        finally{
            set({isUpdatingProfile:false})
        }
    },

    connectSocket: ()=>{
        const {authUser}= get()
        if(!authUser || get().socket?.connected) return;

        const socket = io(BASE_URL, {
            query:{userId:authUser._id}
        })
        socket.connect();
        set({socket: socket});

        socket.on("getOnlineUsers", (userIds)=>{
            set({onlineUsers:userIds})
        })
    },
    disconnectSocket: ()=>{
        if(get().socket?.connected) get().socket.disconnect()
    },
}))

