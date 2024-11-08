

// Hàm format lỗi validation để chuẩn hóa theo format mong muốn
export function formatValidationError(errorDetails) {
    return errorDetails.map(err => ({
        field_name: err.path.join('.'),
        error_message: err.message
    }));
}


 