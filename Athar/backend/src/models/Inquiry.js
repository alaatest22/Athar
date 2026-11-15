import mongoose from 'mongoose';
const schema=new mongoose.Schema({
 name:{type:String,required:true,trim:true,maxlength:120},phone:{type:String,required:true},
 email:{type:String,lowercase:true,trim:true},
 projectId:{type:mongoose.Schema.Types.ObjectId,ref:'Project',required:true,index:true},
 message:{type:String,required:true,maxlength:3000}
},{timestamps:true});
export default mongoose.model('Inquiry',schema);
