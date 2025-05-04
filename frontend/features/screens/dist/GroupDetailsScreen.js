"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var react_1 = require("react");
var react_native_1 = require("react-native");
var react_native_paper_1 = require("react-native-paper");
var FontAwesome_1 = require("react-native-vector-icons/FontAwesome");
var react_native_image_picker_1 = require("react-native-image-picker");
var AuthContext_1 = require("../context/AuthContext");
var GroupContext_1 = require("../context/GroupContext");
var react_native_alert_notification_1 = require("react-native-alert-notification");
var react_native_2 = require("react-native");
var GroupDetailsScreen = function (_a) {
    var _b, _c, _d, _e, _f;
    var route = _a.route;
    var user = AuthContext_1.useAuth().user;
    var groupId = route.params.groupId;
    var _g = GroupContext_1.useGroup(), group = _g.group, fetchGroupById = _g.fetchGroupById, handleUpdateGroup = _g.handleUpdateGroup, handleDeleteGroup = _g.handleDeleteGroup, loading = _g.loading, setLoading = _g.setLoading, updateTodo = _g.updateTodo, markTaskComplete = _g.markTaskComplete;
    var _h = react_1.useState(false), editMode = _h[0], setEditMode = _h[1];
    var _j = react_1.useState(''), title = _j[0], setTitle = _j[1];
    var _k = react_1.useState(''), goal = _k[0], setGoal = _k[1];
    var _l = react_1.useState([]), members = _l[0], setMembers = _l[1];
    var _m = react_1.useState([]), selectedMembers = _m[0], setSelectedMembers = _m[1];
    var _o = react_1.useState(null), image = _o[0], setImage = _o[1];
    var _p = react_1.useState([]), tasks = _p[0], setTasks = _p[1];
    react_1.useEffect(function () {
        var fetchData = function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setLoading(true);
                        return [4 /*yield*/, fetchGroupById(groupId)];
                    case 1:
                        _a.sent();
                        setLoading(false);
                        return [2 /*return*/];
                }
            });
        }); };
        // eslint-disable-next-line react-hooks/rules-of-hooks
        if (groupId) {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupId]);
    react_1.useEffect(function () {
        var _a, _b;
        if (group) {
            setTitle(group.title);
            setGoal(group.goal);
            setMembers(group.members || []);
            setImage(group.image);
            setSelectedMembers(((_a = group.members) === null || _a === void 0 ? void 0 : _a.map(function (m) { return m._id; })) || []);
            setTasks(((_b = group.todo) === null || _b === void 0 ? void 0 : _b.tasks) || []);
        }
    }, [group]);
    var validateText = function (text) {
        return text && text.trim().length > 0;
    };
    var pickImage = function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, react_native_image_picker_1.launchImageLibrary({
                        mediaType: 'photo',
                        includeBase64: false
                    })];
                case 1:
                    result = _a.sent();
                    if ((result === null || result === void 0 ? void 0 : result.assets) && result.assets.length > 0) {
                        setImage(result.assets[0]);
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var toggleMemberSelection = function (id) {
        setSelectedMembers(function (prev) {
            return prev.includes(id) ? prev.filter(function (mid) { return mid !== id; }) : __spreadArrays(prev, [id]);
        });
    };
    var saveGroupChanges = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!validateText(title) || !validateText(goal)) {
                        react_native_alert_notification_1.Dialog.show({
                            type: react_native_alert_notification_1.ALERT_TYPE.DANGER,
                            title: 'Error',
                            textBody: 'Group update failed!',
                            button: 'OK'
                        });
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    setLoading(true);
                    return [4 /*yield*/, handleUpdateGroup(groupId, title, goal, selectedMembers, image)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, updateTodo(groupId, tasks)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    console.log(error_1);
                    return [3 /*break*/, 6];
                case 5:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    if (loading) {
        return (react_1["default"].createElement(react_native_1.View, { style: styles.container },
            react_1["default"].createElement(react_native_1.ActivityIndicator, { size: "large", color: "#0000ff" })));
    }
    var handleTaskChange = function (index, newText) {
        var updated = __spreadArrays(tasks);
        updated[index].title = newText;
        setTasks(updated);
    };
    var addNewTask = function () {
        setTasks(__spreadArrays(tasks, [{ title: '', completedBy: [] }]));
    };
    var removeTask = function (index) {
        var updated = tasks.filter(function (_, i) { return i !== index; });
        setTasks(updated);
    };
    var updateTaskChanges = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setLoading(true);
                    return [4 /*yield*/, updateTodo(groupId, tasks)];
                case 1:
                    _a.sent();
                    react_native_alert_notification_1.Dialog.show({
                        type: react_native_alert_notification_1.ALERT_TYPE.SUCCESS,
                        title: 'Updated',
                        textBody: 'Tasks updated successfully!',
                        button: 'OK'
                    });
                    return [3 /*break*/, 4];
                case 2:
                    error_2 = _a.sent();
                    console.log(error_2);
                    react_native_alert_notification_1.Dialog.show({
                        type: react_native_alert_notification_1.ALERT_TYPE.DANGER,
                        title: 'Error',
                        textBody: 'Failed to update tasks.',
                        button: 'OK'
                    });
                    return [3 /*break*/, 4];
                case 3:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleCompleteTask = function (taskId) { return __awaiter(void 0, void 0, void 0, function () {
        var res, error_3;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, 4, 5]);
                    setLoading(true);
                    return [4 /*yield*/, markTaskComplete(groupId, taskId)];
                case 1:
                    res = _c.sent();
                    react_native_alert_notification_1.Dialog.show({
                        type: react_native_alert_notification_1.ALERT_TYPE.SUCCESS,
                        title: 'Success',
                        textBody: res.message || 'Task marked complete!',
                        button: 'OK'
                    });
                    return [4 /*yield*/, fetchGroupById(groupId)];
                case 2:
                    _c.sent(); // Refresh group tasks
                    return [3 /*break*/, 5];
                case 3:
                    error_3 = _c.sent();
                    console.error('Error marking task complete:', error_3);
                    react_native_alert_notification_1.Dialog.show({
                        type: react_native_alert_notification_1.ALERT_TYPE.DANGER,
                        title: 'Error',
                        textBody: ((_b = (_a = error_3 === null || error_3 === void 0 ? void 0 : error_3.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Failed to complete task',
                        button: 'OK'
                    });
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (react_1["default"].createElement(react_native_2.ScrollView, { style: styles.container, contentContainerStyle: { paddingBottom: 50 } },
        editMode ? (react_1["default"].createElement(react_1["default"].Fragment, null,
            react_1["default"].createElement(react_native_1.TextInput, { style: styles.input, placeholder: "Group Title", value: title, onChangeText: setTitle }),
            react_1["default"].createElement(react_native_1.TextInput, { style: styles.input, placeholder: "Group Goal", value: goal, onChangeText: setGoal }),
            react_1["default"].createElement(react_native_1.TouchableOpacity, { onPress: pickImage },
                react_1["default"].createElement(react_native_1.Text, { style: { color: 'blue', marginBottom: 10 } }, "Pick New Group Image")),
            image ? (react_1["default"].createElement(react_native_1.Image, { source: { uri: image.uri || image }, style: { width: 100, height: 100, marginBottom: 10 } })) : (react_1["default"].createElement(react_native_1.TouchableOpacity, { onPress: pickImage },
                react_1["default"].createElement(react_native_1.View, { style: {
                        width: 100,
                        height: 100,
                        marginBottom: 10,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#eee',
                        borderRadius: 8
                    } },
                    react_1["default"].createElement(react_native_1.Text, { style: { color: '#888' } }, "Pick Group Image")))),
            react_1["default"].createElement(react_native_1.Text, { style: styles.subTitle }, "Select Members:"),
            user.followers.map(function (item) { return (react_1["default"].createElement(react_native_1.TouchableOpacity, { key: item._id, style: styles.memberItem, onPress: function () { return toggleMemberSelection(item._id); } },
                react_1["default"].createElement(FontAwesome_1["default"], { name: selectedMembers.includes(item._id)
                        ? 'check-circle'
                        : 'circle-o', size: 24, color: selectedMembers.includes(item._id) ? 'green' : 'gray', style: { marginRight: 10 } }),
                react_1["default"].createElement(react_native_1.View, null,
                    react_1["default"].createElement(react_native_1.Text, { style: styles.memberName }, item.name),
                    react_1["default"].createElement(react_native_1.Text, { style: styles.memberEmail }, item.email)))); }),
            react_1["default"].createElement(react_native_1.Text, { style: styles.subTitle }, "Edit Tasks"),
            tasks.map(function (task, index) { return (react_1["default"].createElement(react_native_1.View, { key: index, style: styles.taskItem },
                react_1["default"].createElement(react_native_1.TextInput, { style: styles.input, placeholder: "Task Title", value: task.title, onChangeText: function (text) { return handleTaskChange(index, text); } }),
                react_1["default"].createElement(react_native_1.TouchableOpacity, { onPress: function () { return removeTask(index); } },
                    react_1["default"].createElement(react_native_1.Text, { style: { color: 'red' } }, "Remove")))); }),
            react_1["default"].createElement(react_native_paper_1.Button, { onPress: addNewTask }, "Add Task"),
            react_1["default"].createElement(react_native_paper_1.Button, { onPress: updateTaskChanges }, "Update Tasks"))) : (react_1["default"].createElement(react_1["default"].Fragment, null,
            react_1["default"].createElement(react_native_1.Text, { style: styles.title }, group === null || group === void 0 ? void 0 : group.title),
            react_1["default"].createElement(react_native_1.Text, { style: styles.goal },
                "Goal: ", group === null || group === void 0 ? void 0 :
                group.goal),
            react_1["default"].createElement(react_native_1.Text, { style: styles.streak },
                "Group Streak: ", group === null || group === void 0 ? void 0 :
                group.streak),
            react_1["default"].createElement(react_native_1.Text, { style: styles.subTitle }, "Admin"),
            react_1["default"].createElement(react_native_1.View, { style: styles.adminContainer },
                react_1["default"].createElement(react_native_1.Image, { source: { uri: (_b = group === null || group === void 0 ? void 0 : group.admin) === null || _b === void 0 ? void 0 : _b.image }, style: styles.adminImage }),
                react_1["default"].createElement(react_native_1.View, null,
                    react_1["default"].createElement(react_native_1.Text, { style: styles.memberName }, (_c = group === null || group === void 0 ? void 0 : group.admin) === null || _c === void 0 ? void 0 : _c.name),
                    react_1["default"].createElement(react_native_1.Text, { style: styles.memberEmail }, (_d = group === null || group === void 0 ? void 0 : group.admin) === null || _d === void 0 ? void 0 : _d.email))),
            react_1["default"].createElement(react_native_1.Text, { style: styles.subTitle }, "Members"),
            members.map(function (item) { return (react_1["default"].createElement(react_native_1.View, { key: item._id, style: styles.memberItem },
                react_1["default"].createElement(react_native_1.Image, { source: { uri: item.image }, style: styles.memberImage }),
                react_1["default"].createElement(react_native_1.View, null,
                    react_1["default"].createElement(react_native_1.Text, { style: styles.memberName }, item.name),
                    react_1["default"].createElement(react_native_1.Text, { style: styles.memberEmail }, item.email)))); }),
            react_1["default"].createElement(react_native_1.Text, { style: styles.subTitle }, "To-Do Tasks"), (_f = (_e = group === null || group === void 0 ? void 0 : group.todo) === null || _e === void 0 ? void 0 : _e.tasks) === null || _f === void 0 ? void 0 :
            _f.map(function (task) {
                var isCompleted = task.completedBy.includes(user._id);
                return (react_1["default"].createElement(react_native_1.TouchableOpacity, { key: task._id, style: [
                        styles.taskItemContainer,
                        isCompleted && styles.taskItemCompleted,
                    ], onPress: function () { return handleCompleteTask(task._id); }, activeOpacity: 0.7 },
                    react_1["default"].createElement(FontAwesome_1["default"], { name: isCompleted ? 'check-circle' : 'circle-o', size: 22, color: isCompleted ? 'green' : '#aaa', style: { marginRight: 10 } }),
                    react_1["default"].createElement(react_native_1.Text, { style: [
                            styles.taskText,
                            isCompleted && styles.taskTextCompleted,
                        ] }, task.title)));
            }))),
        react_1["default"].createElement(react_native_1.View, { style: styles.buttonContainer }, editMode ? (react_1["default"].createElement(react_1["default"].Fragment, null,
            react_1["default"].createElement(react_native_paper_1.Button, { mode: "contained", onPress: saveGroupChanges }, "Save Changes"),
            react_1["default"].createElement(react_native_paper_1.Button, { mode: "outlined", onPress: function () { return setEditMode(false); } }, "Cancel"))) : (react_1["default"].createElement(react_1["default"].Fragment, null,
            react_1["default"].createElement(react_native_paper_1.Button, { mode: "contained", style: { backgroundColor: 'tomato', marginBottom: 10 }, onPress: function () { return setEditMode(true); } }, "Edit Group"),
            react_1["default"].createElement(react_native_paper_1.Button, { mode: "outlined", onPress: handleDeleteGroup }, "Delete Group"))))));
};
exports["default"] = GroupDetailsScreen;
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#f7f7f7'
    },
    taskItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: '#ddd'
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333'
    },
    goal: {
        fontSize: 16,
        marginBottom: 5,
        color: '#555'
    },
    streak: {
        fontSize: 16,
        marginBottom: 15,
        color: '#28a745'
    },
    subTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 25,
        marginBottom: 10,
        color: '#444'
    },
    adminContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        marginBottom: 10
    },
    adminImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        marginBottom: 10
    },
    memberImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15
    },
    memberName: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333'
    },
    memberEmail: {
        color: '#777'
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        marginBottom: 12,
        borderRadius: 8,
        backgroundColor: '#fff'
    },
    taskItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff'
    },
    taskText: {
        fontSize: 16,
        color: '#333',
        flex: 1
    },
    taskTextCompleted: {
        textDecorationLine: 'line-through',
        color: '#999'
    },
    taskItemCompleted: {
        backgroundColor: '#f9f9f9'
    },
    buttonContainer: {
        marginTop: 30,
        marginBottom: 20,
        gap: 10
    }
});
