"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionStatus = exports.SubscriptionPlan = exports.SchoolStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["SCHOOL_ADMIN"] = "SCHOOL_ADMIN";
    UserRole["TEACHER"] = "TEACHER";
    UserRole["PARENT"] = "PARENT";
})(UserRole || (exports.UserRole = UserRole = {}));
var SchoolStatus;
(function (SchoolStatus) {
    SchoolStatus["PENDING"] = "PENDING";
    SchoolStatus["APPROVED"] = "APPROVED";
    SchoolStatus["REJECTED"] = "REJECTED";
    SchoolStatus["SUSPENDED"] = "SUSPENDED";
})(SchoolStatus || (exports.SchoolStatus = SchoolStatus = {}));
var SubscriptionPlan;
(function (SubscriptionPlan) {
    SubscriptionPlan["FREE"] = "FREE";
    SubscriptionPlan["PAID"] = "PAID";
})(SubscriptionPlan || (exports.SubscriptionPlan = SubscriptionPlan = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["EXPIRED"] = "EXPIRED";
    SubscriptionStatus["CANCELLED"] = "CANCELLED";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
//# sourceMappingURL=index.js.map