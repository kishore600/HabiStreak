import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    top:70,
    backgroundColor: "#fff",
    justifyContent: "flex-start",
    alignItems:"flex-start",
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    marginBottom: 15,
  },
  imagePickerText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
  },

  input: {
    fontSize: 18,
    textAlignVertical: "top",
    padding: 10,
    marginBottom: 15,
    color: "#333",
  },
  descriptionPreview: {
    marginBottom: 10,
  },
  boldText: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#222",
  },
  italicText: {
    fontStyle: "italic",
    fontSize: 18,
    color: "#555",
  },
  createButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: '100%',
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  removeImageButton: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 5,
  },
  imageContainer: {
    position: "relative",
    alignItems: "center",
    marginVertical: 10,
    width: "100%",  // Ensure it takes full width
  },  

  imagePreview: {
    width: "100%",  // Takes full width of the screen
    height: 250,    // Adjust height as needed
    borderRadius: 10,
    resizeMode: "cover", // Ensures the image scales properly
  },

  
});
