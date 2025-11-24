import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      required: true,
      enum: ['news', 'price', 'ai', 'meme'],
      index: true,
    },
    contentId: {
      type: String,
      required: true,
    },
    voteType: {
      type: String,
      required: true,
      enum: ['up', 'down'],
    },
    keywords: {
      type: [String],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one vote per user per content
voteSchema.index({ user: 1, contentType: 1, contentId: 1 }, { unique: true });

// Static method to get vote counts
voteSchema.statics.getVoteCounts = async function (contentType, contentId) {
  const upvotes = await this.countDocuments({
    contentType,
    contentId,
    voteType: 'up',
  });
  
  const downvotes = await this.countDocuments({
    contentType,
    contentId,
    voteType: 'down',
  });

  return { upvotes, downvotes };
};

// Static method to get user vote
voteSchema.statics.getUserVote = async function (userId, contentType, contentId) {
  const vote = await this.findOne({
    user: userId,
    contentType,
    contentId,
  });

  return vote ? vote.voteType : null;
};

const Vote = mongoose.model('Vote', voteSchema);

export default Vote;

