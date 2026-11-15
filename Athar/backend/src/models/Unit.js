import mongoose from 'mongoose';
const schema=new mongoose.Schema({
 projectId:{type:mongoose.Schema.Types.ObjectId,ref:'Project',required:true,index:true},
 unitNumber:{type:String,required:true},type:{type:String,enum:['villa','apartment','townhouse'],required:true},
 area:{type:Number,required:true,min:1},price:{type:Number,required:true,min:0},
 bedrooms:{type:Number,required:true,min:0},bathrooms:{type:Number,required:true,min:0},
 status:{type:String,enum:['available','reserved','sold'],default:'available'}
},{timestamps:true});
schema.index({projectId:1,unitNumber:1},{unique:true});
export default mongoose.model('Unit',schema);
