<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return ApiResponse::error('These credentials do not match our records.', 401);
        }

        $token = $user->createToken('admin')->plainTextToken;

        return ApiResponse::success([
            'token' => $token,
            'user' => $this->userPayload($user),
        ], 'Signed in');
    }

    public function me(Request $request): JsonResponse
    {
        return ApiResponse::success($this->userPayload($request->user()), 'Current user');
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return ApiResponse::success(null, 'Signed out');
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            return ApiResponse::error('The current password is incorrect.', 422, [
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        if (Hash::check($data['password'], $user->password)) {
            return ApiResponse::error('The new password must be different from your current password.', 422, [
                'password' => ['The new password must be different from your current password.'],
            ]);
        }

        // The User model casts `password` as `hashed`, so this is stored hashed.
        $user->update(['password' => $data['password']]);

        // Sign out other devices; keep this session active.
        $currentId = $user->currentAccessToken()->id;
        $user->tokens()->where('id', '!=', $currentId)->delete();

        return ApiResponse::success(null, 'Password updated');
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ];
    }
}
