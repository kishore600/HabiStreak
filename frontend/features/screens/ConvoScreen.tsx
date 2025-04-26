// import React, {useState} from 'react';
// import {
//   View,
//   Text,
//   Image,
//   TouchableOpacity,
//   Alert,
//   TextInput,
//   ActivityIndicator,
// } from 'react-native';
// import * as ImagePicker from 'react-native-image-picker';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import {useGroup} from '../context/GroupContext.tsx';
// import styles from '../styles/styles.ts';

// const ConvoScreen = () => {
//   const {groups, loading} = useGroup();
//   const [newConvo, setNewConvo] = useState({image: '', description: ''});

//   // Function to select an image
//   const selectImage = () => {
//     const options: any = {
//       mediaType: 'photo',
//       quality: 1,
//     };

//     ImagePicker.launchImageLibrary(options, response => {
//       if (response.didCancel) {
//         console.log('User cancelled image picker');
//       } else if (response.errorMessage) {
//         Alert.alert('Error', response.errorMessage);
//       } else if (response.assets && response.assets.length > 0) {
//         setNewConvo({...newConvo, image: response.assets[0].uri ?? ''});
//       }
//     });
//   };

//   const handleCreate = () => {
//     if (!newConvo.image || !newConvo.description) {
//       Alert.alert('Error', 'Please add an image and description.');
//       return;
//     }
//     createConvo(newConvo);
//     setNewConvo({image: '', description: ''});
//   };
//   const removeImage = () => {
//     setNewConvo({...newConvo, image: ''});
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Create a Post</Text>

//       {/* Image Upload */}
//       <TouchableOpacity style={styles.imagePickerButton} onPress={selectImage}>
//         {!newConvo.image && (
//           <View>
//             <Icon name="picture-o" size={30} color="#333" />
//           </View>
//         )}
//       </TouchableOpacity>
//       {newConvo.image ? (
//         <View style={styles.imageContainer}>
//           <Image source={{uri: newConvo.image}} style={styles.imagePreview} />
//           <TouchableOpacity
//             style={styles.removeImageButton}
//             onPress={removeImage}>
//             <Icon name="times-circle" size={24} color="red" />
//           </TouchableOpacity>
//         </View>
//       ) : null}

//       {/* Description Input */}
//       <TextInput
//         placeholder="Write something..."
//         style={styles.input}
//         multiline
//         value={newConvo.description}
//         onChangeText={text => setNewConvo({...newConvo, description: text})}
//       />

//       {/* Submit Button */}
//       <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
//         {loading ? (
//           <ActivityIndicator size="small" color="#fff" />
//         ) : (
//           <Text style={styles.createButtonText}>Post</Text>
//         )}
//       </TouchableOpacity>
//     </View>
//   );
// };

// export default ConvoScreen;


import React from 'react'

const ConvoScreen = () => {
  return (
    <div>ConvoScreen</div>
  )
}

export default ConvoScreen