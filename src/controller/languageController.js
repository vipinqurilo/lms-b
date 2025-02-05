const Language = require('../model/languageModel');

// Create a new language
exports.createLanguage = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Language name is required" });
        }

        const newLanguage = new Language({ name });
        await newLanguage.save();

        res.status(201).json({ message: "Language created successfully", language: newLanguage });
    } catch (error) {
        res.status(500).json({ error: "Failed to create language", details: error.message });
    }
};

// Get all languages
exports.getLanguages = async (req, res) => {
    try {
        const languages = await Language.find();
        res.status(200).json({ languages });
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve languages", details: error.message });
    }
};

// Get a single language by ID
exports.getLanguageById = async (req, res) => {
    try {
        const { id } = req.params;

        const language = await Language.findById(id);
        if (!language) {
            return res.status(404).json({ error: "Language not found" });
        }

        res.status(200).json({ language });
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve language", details: error.message });
    }
};

// Update a language by ID
exports.updateLanguage = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Language name is required" });
        }

        const updatedLanguage = await Language.findByIdAndUpdate(id, { name }, { new: true });

        if (!updatedLanguage) {
            return res.status(404).json({ error: "Language not found" });
        }

        res.status(200).json({ message: "Language updated successfully", language: updatedLanguage });
    } catch (error) {
        res.status(500).json({ error: "Failed to update language", details: error.message });
    }
};

// Delete a language by ID
exports.deleteLanguage = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedLanguage = await Language.findByIdAndDelete(id);
        if (!deletedLanguage) {
            return res.status(404).json({ error: "Language not found" });
        }

        res.status(200).json({ message: "Language deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete language", details: error.message });
    }
};
