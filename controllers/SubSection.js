const SubSection = require('../models/SubSection');
const Section = require('../models/Section');
const { uploadImageToCloudinary } = require('../utils/imageUploader');

// ====================== CREATE SUBSECTION =========================
exports.createSubSection = async (req, res) => {
  try {
    const { sectionId, title, description } = req.body;
    const video = req?.files?.video;

    if (!sectionId || !title || !description || !video) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required (sectionId, title, description, video)',
      });
    }

    // Upload video to Cloudinary
    const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);

    // Create subsection
    const newSubSection = await SubSection.create({
      title,
      timeDuration: `${uploadDetails.duration}`,
      description,
      videoUrl: uploadDetails.secure_url,
    });

    // Add to Section
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      { $push: { subSection: newSubSection._id } },
      { new: true }
    ).populate('subSection');

    return res.status(200).json({
      success: true,
      message: 'SubSection created successfully',
      data: updatedSection,
    });
  } catch (error) {
    console.error("Create SubSection Error:", error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create SubSection',
      error: error.message,
    });
  }
};

// ====================== UPDATE SUBSECTION =========================
exports.updateSubSection = async (req, res) => {
  try {
    const { sectionId, subSectionId, title, description } = req.body;

    if (!subSectionId || !sectionId) {
      return res.status(400).json({
        success: false,
        message: 'sectionId and subSectionId are required',
      });
    }

    const subSection = await SubSection.findById(subSectionId);
    if (!subSection) {
      return res.status(404).json({
        success: false,
        message: 'SubSection not found',
      });
    }

    // Update fields if provided
    if (title) subSection.title = title;
    if (description) subSection.description = description;

    if (req.files && req.files.video) {
      const uploadDetails = await uploadImageToCloudinary(
        req.files.video,
        process.env.FOLDER_NAME
      );
      subSection.videoUrl = uploadDetails.secure_url;
      subSection.timeDuration = `${uploadDetails.duration}`;
    }

    await subSection.save();

    const updatedSection = await Section.findById(sectionId).populate('subSection');

    return res.status(200).json({
      success: true,
      message: 'SubSection updated successfully',
      data: updatedSection,
    });
  } catch (error) {
    console.error("Update SubSection Error:", error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update SubSection',
      error: error.message,
    });
  }
};

// ====================== DELETE SUBSECTION =========================
exports.deleteSubSection = async (req, res) => {
  try {
    const { sectionId, subSectionId } = req.body;

    if (!subSectionId || !sectionId) {
      return res.status(400).json({
        success: false,
        message: 'Both sectionId and subSectionId are required',
      });
    }

    // Remove from section's subSection list
    await Section.findByIdAndUpdate(sectionId, {
      $pull: { subSection: subSectionId },
    });

    // Delete subSection
    const subSection = await SubSection.findByIdAndDelete(subSectionId);
    if (!subSection) {
      return res.status(404).json({
        success: false,
        message: 'SubSection not found',
      });
    }

    const updatedSection = await Section.findById(sectionId).populate('subSection');

    return res.status(200).json({
      success: true,
      message: 'SubSection deleted successfully',
      data: updatedSection,
    });
  } catch (error) {
    console.error("Delete SubSection Error:", error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete SubSection',
      error: error.message,
    });
  }
};
