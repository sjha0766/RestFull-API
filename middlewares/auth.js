import JwtService from '../services/JwtService';
import CustomErrorHandler from '../services/CustomErrorHandler';
const auth= async(req,res,next)=>{
  const authHeader=req.headers.authorization;
  

    if(!authHeader){
        return next(CustomErrorHandler.unAuthorized())
    }
    const token=authHeader.split(' ')[1]; 
   try {
    const {_id,role}=await JwtService.verify(token);
    const user={
        _id,
        role
    }
    req.user=user;
    next();
   } catch (err) {
    return next(CustomErrorHandler.unAuthorized());
   }
 
}
export default auth;