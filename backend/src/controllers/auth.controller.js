import User from "../models/user.model.js"
import bcrypt from"bcryptjs"
import {generateToken} from "../lib/utils.js"
import cloudinary from "../lib/cloudinary.js"

export const signup = async (req, res) => {
    const {fullname, email, password}=req.body;
    try {

        if(!fullname || !email || !password){
            return res.status(400).json({message:"please fill all the fields"})
        }

        if(password.length<6)
        {
            res.status(400).json({message:"password must have atleast 6 characters"});
        }
        const user= await User.findOne({email})
        if(user)
        {
            res.status(400).json({message:"email already exists"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt);

        const newUser = new User({
            fullname,
            email,
            password:hashedPassword,
        })

        if(newUser){
            //generate jwt
            generateToken(newUser._id, res)
            await newUser.save();
            res.status(201).json({
                _id:newUser._id,
                fullname:newUser.fullname,
                email:newUser.email,
                profilePic:newUser.profilePic,
            })
        }
        else{
            res.status(400).json({message:"Enter Valid Details"})
        }
    } 
    
    catch (error) {
        console.log("erroe in signup controller",error.message)
        res.status(500).json({message:"something is broken"})
    }
}

export const login = async(req, res) => {
    const {email, password}=req.body;
    try {
        const user= await User.findOne({email})
        if(!user){
            return res.status(400).json({message:"invalid credentials"});
        }
        const isPasswordCorrect= await bcrypt.compare(password, user.password);
        if(!isPasswordCorrect){
            return res.status(400).json({message:"invalid password, try again"});
        }

        generateToken(user._id, res);
        res.status(200).json({
            _id:user._id,
            fullname:user.fullname,
            email:user.email,
            profilePic:user.profilePic,
        })
    } 
    
    catch (error) {
        console.log("error in login controller",error.message)
        res.status(500).json({message:"something is broken"})        
    }
}

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", {
        maxAge: 0,//delete cookie    
    })
    res.status(201).json({message:"logged out successfully"})
    } catch (error) {
        console.log("error in logout controller",error.message)
        res.status(500).json({message:"something is broken"})
        
    }
}

export const updateProfile = async (req, res)=>{
    try {
    const {profilePic}=req.body;
    const userId = req.user._id;
    if(!profilePic)
    {
       return res.status(400).json({message:"Please Provide Profile Picture"});
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic)
    const updatedUser = await User.findByIdAndUpdate(userId, 
        {profilePic:uploadResponse.secure_url}, 
        {new:true});
    res.status(200).json(updatedUser)
    }
    
    catch (error) {
    console.log("error in updateProfile controller",error.message)
    res.status(500).json({message:"something is broken"})        
    }
}

export const checkAuth = (req, res)=>{
try {
    res.status(200).json(req.user)
} catch (error) {
    console.log("error in checkAuth controller",error.message)
    res.status(500).json({message:"something is broken"})
}
}
