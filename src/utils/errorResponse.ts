interface ErrorResponseData {
    success: false;
    message: string;
    statusCode: number;
    errors?: unknown[];
}

interface SuccessResponseData<T = unknown> {
    success: true;
    message: string;
    data: T;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

export const errorResponse = (
    message: string,
    statusCode: number = 500,
    errors?: unknown[]
): ErrorResponseData => {
    return {
        success: false,
        message,
        statusCode,
        ...(errors && { errors }),
    };
};

export const successResponse = <T>(
    message: string,
    data: T,
    meta?: SuccessResponseData['meta']
): SuccessResponseData<T> => {
    return {
        success: true,
        message,
        data,
        ...(meta && { meta }),
    };
};

// للـ Pagination
export const paginatedResponse = <T>(
    message: string,
    data: T[],
    page: number,
    limit: number,
    total: number
): SuccessResponseData<T[]> => {
    return {
        success: true,
        message,
        data,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};
