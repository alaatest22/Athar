import mongoose from 'mongoose';
const schema = new mongoose.Schema({
 name: {type:String,required:true,trim:true,maxlength:150},
 slug: {type:String,required:true,unique:true,trim:true},
 city: {type:String,required:true,index:true},
 type: {type:String,enum:['villa','apartment','townhouse','mixed'],required:true},
 status: {type:String,enum:['upcoming','under_construction','ready','sold_out'],required:true},
 priceFrom:{type:Number,required:true,min:0}, totalUnits:{type:Number,required:true,min:0},
 gallery:[String], image:{type:String,required:true}, description:{type:String,required:true},
 location:{address:{type:String,required:true},latitude:{type:Number,min:-90,max:90,required:true},longitude:{type:Number,min:-180,max:180,required:true}},
 features:[String]
},{timestamps:true});
schema.index({city:1,type:1,status:1});
export default mongoose.model('Project',schema);
