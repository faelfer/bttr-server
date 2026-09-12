package br.com.bttr.shared.pagination;

import br.com.bttr.shared.dtos.PageResponse;
import br.com.bttr.shared.exception.ApiException;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import jakarta.ws.rs.core.UriInfo;

public final class Pagination {
    public static final int SIZE = 5;

    private Pagination() {}

    public static <E> PageResult<E> query(PanacheQuery<E> query, int page) {
        validate(page);
        long count = query.count();
        var results = query.page(page - 1, SIZE).list();
        return new PageResult<>(count, results);
    }

    public static <T> PageResponse<T> response(PageResult<T> result, int page, UriInfo uri) {
        validate(page);
        return new PageResponse<>(result.count(),
                (long) page * SIZE < result.count() ? link(uri, page + 1) : null,
                page > 1 ? link(uri, page - 1) : null,
                result.results());
    }

    private static void validate(int page) {
        if (page < 1 || page > Integer.MAX_VALUE / SIZE) {
            throw new ApiException(400, "página inválida.");
        }
    }

    private static String link(UriInfo uri, int page) {
        return uri.getAbsolutePathBuilder().queryParam("page", page).build().toString();
    }
}
