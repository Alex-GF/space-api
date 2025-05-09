import mongoose, { Schema } from 'mongoose';

const consumptionLevelSchema = new Schema(
  {
    usageLimitName: { type: String, required: true },
    resetTimeStamp: { type: Date, required: true },
    consumed: { type: Number, required: true },
  },
  { _id: false }
)

const contractedServiceSchema = new Schema(
  {
    path: { type: String, required: true },
  }
)

const contractSchema = new Schema(
  {
    userContact: {
      userId: { type: String, required: true },
      username: { type: String, required: true },
      firstName: { type: String},
      lastName: { type: String},
      email: { type: String},
      phone: { type: String},
    },
    billingPeriod: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      autoRenew: { type: Boolean, default: false },
      renewalDays: { type: Number, default: 30 },
    },
    quotaConsumption: {type: Map, of: consumptionLevelSchema},
    contractedServices: {type: Map, of: contractedServiceSchema},
    subscriptionPlans: { type: Map, of: String },
    subscriptionAddOns: { type: Map, of: {type: Map, of: Number} },
    history: [{
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      contractedServices: {type: Map, of: contractedServiceSchema},
      subscriptionPlans: { type: Map, of: String },
      subscriptionAddOns: { type: Map, of: {type: Map, of: Number} },
    }]
  },
  {
    toJSON: {
      virtuals: true,
      transform: function (doc, resultObject, options) {
        delete resultObject._id;
        delete resultObject.__v;
        return resultObject;
      },
    },
  }
);

// Adding unique index for [name, owner, version]
contractSchema.index({ userId: 1 }, { unique: true });

const contractModel = mongoose.model('Contract', contractSchema, 'contracts');

export default contractModel;