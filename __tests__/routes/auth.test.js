"use strict";
/**
 * Auth Routes Integration Tests
 * Tests for /api/v1/auth endpoints (register, login)
 */

const request = require("supertest");
const app = require("../../server/app");
const { Organization, User } = require("../../server/models");

describe("Auth Routes", () => {
    let testOrganization;

    // Create a test organization before each test
    beforeEach(async () => {
        testOrganization = await Organization.create({
            name: "Test Hotel",
            type: "HOTEL",
            country: "TR",
            timezone: "Europe/Istanbul",
            currency: "TRY",
            is_active: true,
        });
    });

    // ============================================
    // REGISTER TESTS
    // ============================================
    describe("POST /api/v1/auth/register", () => {
        const validUserData = {
            email: "test@example.com",
            password: "Test1234!",
            first_name: "John",
            last_name: "Doe",
        };

        test("should register a new user successfully", async () => {
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    ...validUserData,
                    organization_id: testOrganization._id.toString(),
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user).toBeDefined();
            expect(res.body.data.user.email).toBe(validUserData.email);
            expect(res.body.data.user.first_name).toBe(validUserData.first_name);
            expect(res.body.data.user.password).toBeUndefined(); // Password should not be returned
            expect(res.body.data.access_token).toBeDefined();
            expect(res.body.data.refresh_token).toBeDefined();
        });

        test("should return 400 when required fields are missing", async () => {
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    email: "test@example.com",
                    // Missing password, first_name, last_name, organization_id
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error.message).toContain("Missing required fields");
        });

        test("should return 404 when organization does not exist", async () => {
            const fakeOrgId = "507f1f77bcf86cd799439011"; // Valid ObjectId format but non-existent

            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    ...validUserData,
                    organization_id: fakeOrgId,
                });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.error.message).toContain("Organization not found");
        });

        test("should return 409 when email already exists in organization", async () => {
            // First registration
            await request(app)
                .post("/api/v1/auth/register")
                .send({
                    ...validUserData,
                    organization_id: testOrganization._id.toString(),
                });

            // Second registration with same email
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    ...validUserData,
                    organization_id: testOrganization._id.toString(),
                });

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
            expect(res.body.error.message).toContain("Email already registered");
        });

        test("should return 400 when password is too short", async () => {
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    ...validUserData,
                    password: "short", // Less than 8 characters
                    organization_id: testOrganization._id.toString(),
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            // Security middleware returns Turkish error message
            expect(res.body.error.message).toContain("güvenlik gereksinimlerini");
        });

        test("should return 403 when organization is inactive", async () => {
            // Deactivate organization
            await Organization.findByIdAndUpdate(testOrganization._id, {
                is_active: false,
            });

            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    ...validUserData,
                    organization_id: testOrganization._id.toString(),
                });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.error.message).toContain("Organization is not active");
        });
    });

    // ============================================
    // LOGIN TESTS
    // ============================================
    describe("POST /api/v1/auth/login", () => {
        const userData = {
            email: "login@example.com",
            password: "Test1234!",
            first_name: "Jane",
            last_name: "Doe",
        };

        // Create a user before login tests
        beforeEach(async () => {
            await request(app)
                .post("/api/v1/auth/register")
                .send({
                    ...userData,
                    organization_id: testOrganization._id.toString(),
                });
        });

        test("should login successfully with valid credentials", async () => {
            const res = await request(app).post("/api/v1/auth/login").send({
                email: userData.email,
                password: userData.password,
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user).toBeDefined();
            expect(res.body.data.user.email).toBe(userData.email);
            expect(res.body.data.user.password).toBeUndefined();
            expect(res.body.data.access_token).toBeDefined();
            expect(res.body.data.refresh_token).toBeDefined();
            expect(res.body.message).toBe("Login successful");
        });

        test("should return 400 when email is missing", async () => {
            const res = await request(app).post("/api/v1/auth/login").send({
                password: userData.password,
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error.message).toContain("Email and password are required");
        });

        test("should return 400 when password is missing", async () => {
            const res = await request(app).post("/api/v1/auth/login").send({
                email: userData.email,
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error.message).toContain("Email and password are required");
        });

        test("should return 401 with invalid email", async () => {
            const res = await request(app).post("/api/v1/auth/login").send({
                email: "nonexistent@example.com",
                password: userData.password,
            });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.error.message).toContain("Invalid credentials");
        });

        test("should return 401 with wrong password", async () => {
            const res = await request(app).post("/api/v1/auth/login").send({
                email: userData.email,
                password: "WrongPassword123!",
            });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.error.message).toContain("Invalid credentials");
        });

        test("should return 403 when user is deactivated", async () => {
            // Deactivate user
            await User.findOneAndUpdate(
                { email: userData.email },
                { is_active: false }
            );

            const res = await request(app).post("/api/v1/auth/login").send({
                email: userData.email,
                password: userData.password,
            });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.error.message).toContain("deactivated");
        });

        test("should update last_login timestamp on successful login", async () => {
            const userBefore = await User.findOne({ email: userData.email });
            expect(userBefore.last_login).toBeNull();

            await request(app).post("/api/v1/auth/login").send({
                email: userData.email,
                password: userData.password,
            });

            const userAfter = await User.findOne({ email: userData.email });
            expect(userAfter.last_login).toBeDefined();
            expect(userAfter.last_login).not.toBeNull();
        });
    });
});
